/* ============================================================
   assets/nav.js — 进度跟踪（AGENT_BRIEF §8 契约）
   - 渲染本章进度条：本章已完成知识点 / 总知识点（读 econ.progress）
   - 记录页面访问（econ.progress[pointId].visited，可选标记）
   - 提供章徽标（track → 颜色/文字）与统一 localStorage 读写工具
   对外：window.Nav
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
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) { /* 忽略 */ }
  }

  function readProgress() { return readJSON('econ.progress', {}); }
  function writeProgress(p) { writeJSON('econ.progress', p); }
  function readErrors() { return readJSON('econ.errors', {}); }
  function writeErrors(e) { writeJSON('econ.errors', e); }

  /* 章徽标：track → {label, cls} */
  function trackInfo(track) {
    if (track === 'macro') return { label: '宏观', cls: 'track-macro' };
    if (track === 'frontier') return { label: '前沿', cls: 'track-frontier' };
    return { label: '微观', cls: 'track-micro' };
  }

  /* 记录访问：只补 visited 时间戳，不触碰 done / wrong / at */
  function markVisited(pointId) {
    if (!pointId) return;
    var p = readProgress();
    if (!p[pointId]) p[pointId] = {};
    p[pointId].visited = Date.now();
    writeProgress(p);
  }

  /* 渲染本章进度条：containerEl 内绘制「第 n/N 讲 + 已完成 x/y（百分比）」 */
  function renderChapterProgress(containerEl, chapterPlan, currentNo) {
    if (!containerEl) return;
    var points = (chapterPlan && chapterPlan.points) || [];
    var total = points.length;
    var prog = readProgress();
    var done = 0;
    points.forEach(function (pt) {
      if (prog[pt.id] && prog[pt.id].done) done++;
    });
    var pct = total ? Math.round(done / total * 100) : 0;
    containerEl.textContent = '';
    var top = document.createElement('div');
    top.className = 'cp-top';
    var left = document.createElement('span');
    left.textContent = '第 ' + (currentNo || 1) + ' / ' + total + ' 讲';
    var right = document.createElement('span');
    right.textContent = '本章进度：' + done + '/' + total + ' 讲已完成（' + pct + '%）';
    top.appendChild(left); top.appendChild(right);
    var bar = document.createElement('div');
    bar.className = 'cp-bar';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuenow', String(pct));
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    var fill = document.createElement('i');
    fill.style.width = pct + '%';
    bar.appendChild(fill);
    containerEl.appendChild(top);
    containerEl.appendChild(bar);
  }

  window.Nav = {
    readProgress: readProgress,
    writeProgress: writeProgress,
    readErrors: readErrors,
    writeErrors: writeErrors,
    trackInfo: trackInfo,
    markVisited: markVisited,
    renderChapterProgress: renderChapterProgress
  };
})();
