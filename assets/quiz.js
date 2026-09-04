/* ============================================================
   assets/quiz.js — 例题判题 + 错题本（AGENT_BRIEF §8 契约）
   - 一次显示一题；答对 → 显示解析并解锁下一题；答错 → 显示 hint、可重做
   - 答错写入 localStorage `econ.errors`：{pointId: {qIndex: {count, lastWrongAt}}}
   - 3 题全对 → `econ.progress`：{pointId: {done: true, wrong: <本次是否曾答错>, at: ts}}
   - 完成后显示「✅ 本讲完成」状态条
   对外：window.Quiz.render(containerEl, point)
   ============================================================ */
(function () {
  'use strict';

  function readJSON(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return (v && typeof v === 'object') ? v : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) { /* 隐私模式等，忽略 */ }
  }
  function readProgress() { return readJSON('econ.progress', {}); }
  function writeProgress(p) { writeJSON('econ.progress', p); }
  function readErrors() { return readJSON('econ.errors', {}); }
  function writeErrors(e) { writeJSON('econ.errors', e); }

  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function esc(s0) {
    return String(s0 == null ? '' : s0).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render(containerEl, point) {
    if (!containerEl || !point || !Array.isArray(point.quiz) || !point.quiz.length) {
      if (containerEl) containerEl.textContent = '（本讲暂无例题）';
      return;
    }
    var pointId = point.id || 'unknown';
    var quiz = point.quiz;
    var state = {
      qi: 0,              // 当前题号
      solved: {},         // 已答对的题 {qIndex: true}
      wrongSession: false // 本次完成前是否曾答错
    };

    containerEl.textContent = '';

    /* 顶部状态条：已完成过的讲显示「✅ 本讲完成」 */
    var progress = readProgress();
    var doneBefore = !!(progress[pointId] && progress[pointId].done);
    var statusBar = h('div', 'quiz-status' + (doneBefore ? ' done' : ''));
    containerEl.appendChild(statusBar);

    var body = h('div', 'quiz-body');
    containerEl.appendChild(body);

    function refreshStatus(msg) {
      var p = readProgress();
      var done = !!(p[pointId] && p[pointId].done);
      statusBar.className = 'quiz-status' + (done ? ' done' : '');
      statusBar.textContent = '';
      if (done) {
        var solvedCount = Object.keys(state.solved).length;
        statusBar.appendChild(h('span', null, '✅ 本讲完成'));
        statusBar.appendChild(h('span', 'redo-note',
          (p[pointId].wrong ? '（本次曾答错，建议近期复习错题）' : '（一次全对，漂亮！）') +
          (msg || '') + '　可继续重做练习。'));
        var prog = h('span', 'quiz-progress', solvedCount + '/' + quiz.length + ' 题');
        statusBar.appendChild(prog);
      } else {
        var solvedCount2 = Object.keys(state.solved).length;
        statusBar.appendChild(h('span', null, '📝 学习进度'));
        statusBar.appendChild(h('span', 'redo-note', '答对全部 ' + quiz.length + ' 题即可完成本讲；答错会给出提示并可重做。'));
        statusBar.appendChild(h('span', 'quiz-progress', solvedCount2 + '/' + quiz.length + ' 题已答对'));
      }
    }

    function recordWrong(qIndex) {
      var errors = readErrors();
      if (!errors[pointId]) errors[pointId] = {};
      var rec = errors[pointId][qIndex] || { count: 0, lastWrongAt: 0 };
      rec.count += 1;
      rec.lastWrongAt = Date.now();
      errors[pointId][qIndex] = rec;
      writeErrors(errors);
    }

    function recordDone() {
      var p = readProgress();
      p[pointId] = {
        done: true,
        wrong: !!state.wrongSession,
        at: Date.now()
      };
      writeProgress(p);
      // 通知页面（page.js 监听后刷新章进度条）
      try { document.dispatchEvent(new CustomEvent('econ:progress')); } catch (e) { /* 忽略 */ }
    }

    function renderQ() {
      var qi = state.qi;
      var q = quiz[qi];
      body.textContent = '';
      if (!q) return;

      var box = h('div', 'quiz-q');
      box.appendChild(h('span', 'quiz-level lv-' + (q.level || 'L1'), (q.level || 'L1') + ' 题'));
      var prog = h('div', 'quiz-progress', '第 ' + (qi + 1) + ' / ' + quiz.length + ' 题');
      box.appendChild(prog);
      var stem = h('p', 'quiz-stem');
      stem.textContent = q.stem || '';
      box.appendChild(stem);

      var opts = h('div', 'quiz-options');
      var buttons = [];
      var feedback = h('div');
      var solved = !!state.solved[qi];

      (q.options || []).forEach(function (opt, oi) {
        var b = h('button', 'quiz-option');
        b.type = 'button';
        var key = h('span', 'opt-key', 'ABCD'[oi] + '.');
        b.appendChild(key);
        b.appendChild(document.createTextNode(String(opt == null ? '' : opt)));
        if (solved) {
          b.disabled = true;
          if (oi === q.answer) b.classList.add('correct');
        }
        b.addEventListener('click', function () {
          if (state.solved[qi]) return;
          if (oi === q.answer) {
            // 答对：高亮 + 解析 + 解锁下一题
            state.solved[qi] = true;
            buttons.forEach(function (bb) { bb.disabled = true; });
            b.classList.add('correct');
            feedback.textContent = '';
            var ex = h('div', 'quiz-explain');
            ex.appendChild(h('span', 'box-cap', '✔ 答对了。解析'));
            ex.appendChild(document.createTextNode(' ' + (q.explain || '')));
            feedback.appendChild(ex);
            var actions = h('div', 'quiz-actions');
            if (qi < quiz.length - 1) {
              var nextBtn = h('button', 'btn-next', '下一题 →');
              nextBtn.type = 'button';
              nextBtn.addEventListener('click', function () {
                state.qi = qi + 1;
                renderQ();
              });
              actions.appendChild(nextBtn);
            } else {
              recordDone();
              var doneMsg = h('div', 'quiz-explain');
              doneMsg.appendChild(h('span', 'box-cap', '🎉'));
              doneMsg.appendChild(document.createTextNode(' 全部 ' + quiz.length + ' 题答对，本讲完成！'));
              feedback.appendChild(doneMsg);
            }
            feedback.appendChild(actions);
            refreshStatus();
          } else {
            // 答错：该选项锁定、显示 hint、可继续重选；写错题本
            state.wrongSession = true;
            b.classList.add('wrong');
            b.disabled = true;
            recordWrong(qi);
            feedback.textContent = '';
            var hint = h('div', 'quiz-hint');
            hint.appendChild(h('span', 'box-cap', '✖ 不对，再想想。提示'));
            hint.appendChild(document.createTextNode(' ' + (q.hint || '')));
            hint.appendChild(document.createTextNode('（可继续选择其他选项）'));
            feedback.appendChild(hint);
          }
        });
        buttons.push(b);
        opts.appendChild(b);
      });

      box.appendChild(opts);
      box.appendChild(feedback);
      body.appendChild(box);
      refreshStatus();
    }

    renderQ();
  }

  window.Quiz = { render: render };
})();
