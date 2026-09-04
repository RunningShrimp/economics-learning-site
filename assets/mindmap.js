/* ============================================================
   assets/mindmap.js — 门户页（index.html）渲染器
   - 站点头 + 总进度（econ.progress 中 done 的知识点 / 106）
   - 思维导图：三大板块 → 20 章 → 106 知识点，可折叠树
     （默认折叠到章级；点击章名展开/收起；知识点为 <a href="{id}.html">；
      已完成带 ✓、做错带 ⚠）
   - 学习地图：按章分组知识点网格 + 状态徽标
     （未学 / 学习中 / 已完成 / 已完成（曾做错）/ 做错·待复习）
   - 错题本：econ.errors 非空的知识点列表 + 清空按钮
   数据源：assets/data/_plan.json（fetch，页面壳只做渲染）
   localStorage 契约（AGENT_BRIEF §8，与 nav.js / quiz.js 一致）：
     econ.progress = { pointId: { done, wrong, at, visited } }
     econ.errors   = { pointId: { qIndex: { count, lastWrongAt } } }
   对外：window.Mindmap = { render }
   ============================================================ */
(function () {
  'use strict';

  var DAY_MS = 24 * 60 * 60 * 1000;
  var REVIEW_WINDOW_MS = 7 * DAY_MS;   /* 待复习窗口：最近做错 7 天内 */

  /* ---------- 工具 ---------- */
  function readJSON(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return (v && typeof v === 'object') ? v : fallback;
    } catch (e) { return fallback; }
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function fmtDate(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function trackInfo(track) {
    if (track === 'macro') return { label: '宏观', cls: 'track-macro', name: '宏观经济学' };
    if (track === 'frontier') return { label: '前沿', cls: 'track-frontier', name: '当代经济学前沿' };
    return { label: '微观', cls: 'track-micro', name: '微观经济学' };
  }

  /* ---------- 状态判定（AGENT_BRIEF §8） ---------- */
  function recentWrong(errors, pointId, now) {
    var e = errors[pointId];
    if (!e) return false;
    for (var k in e) {
      if (Object.prototype.hasOwnProperty.call(e, k) && e[k] &&
          e[k].lastWrongAt && (now - e[k].lastWrongAt) <= REVIEW_WINDOW_MS) return true;
    }
    return false;
  }

  function stateOf(pointId, progress, errors, now) {
    var p = progress[pointId] || {};
    if (p.done && p.wrong) return { key: 'done-wrong', label: '已完成（曾做错）', cls: 'b-donewrong' };
    if (p.done) return { key: 'done', label: '已完成', cls: 'b-done' };
    if (recentWrong(errors, pointId, now)) return { key: 'review', label: '做错·待复习', cls: 'b-review' };
    if (p.visited) return { key: 'learning', label: '学习中', cls: 'b-learning' };
    return { key: 'new', label: '未学', cls: 'b-new' };
  }

  /* 思维导图节点标记：done → ✓；wrong 或 7 天内做错 → ⚠ */
  function markSpan(pointId, progress, errors, now) {
    var p = progress[pointId] || {};
    var span = el('span', 'mm-mk');
    if (p.done) span.appendChild(el('b', 'mk-done', '✓'));
    if (p.wrong || recentWrong(errors, pointId, now)) span.appendChild(el('b', 'mk-warn', '⚠'));
    return span;
  }

  function chapterDone(ch, progress) {
    var done = 0;
    ch.points.forEach(function (pt) { if (progress[pt.id] && progress[pt.id].done) done++; });
    return done;
  }

  /* ---------- 站点头：标题 + 副标题 + 总进度 + 方法论入口 ---------- */
  function buildHeader(chapters, progress) {
    var total = 0, done = 0;
    chapters.forEach(function (ch) {
      total += ch.points.length;
      done += chapterDone(ch, progress);
    });
    var pct = total ? Math.round(done / total * 100) : 0;

    var head = el('header', 'portal-head');
    var badges = el('div', 'portal-badges');
    ['micro', 'macro', 'frontier'].forEach(function (t) {
      var info = trackInfo(t);
      badges.appendChild(el('span', 'badge ' + info.cls, info.label));
    });
    head.appendChild(badges);
    head.appendChild(el('h1', null, '经济学自学站'));
    head.appendChild(el('p', 'portal-sub',
      '零基础 → 考研与中高级 ｜ 微观 · 宏观 · 前沿，共 ' + total + ' 个交互式知识点'));

    var prog = el('div', 'portal-progress');
    var top = el('div', 'cp-top');
    top.appendChild(el('span', null, '总进度：已完成 ' + done + ' / ' + total + ' 个知识点'));
    top.appendChild(el('span', null, pct + '%'));
    prog.appendChild(top);

    var bar = el('div', 'cp-bar');
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuenow', String(pct));
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    var fill = el('i');
    fill.style.width = pct + '%';
    bar.appendChild(fill);
    prog.appendChild(bar);

    var links = el('div', 'portal-links');
    var about = el('a', 'portal-about-link', '📘 学习方法论：怎么学最有效 →');
    about.href = 'about.html';
    links.appendChild(about);
    prog.appendChild(links);

    head.appendChild(prog);
    return head;
  }

  /* ---------- 首次访问引导（一句话） ---------- */
  function buildGuide() {
    var seen = false;
    try { seen = localStorage.getItem('econ.introSeen') === '1'; } catch (e) { seen = true; }
    if (seen) return null;

    var box = el('div', 'guide-box');
    box.setAttribute('role', 'note');
    box.appendChild(el('p', null,
      '👋 欢迎来到经济学自学站！点开下方「思维导图」里任意一章进入第一讲，' +
      '按 🌱L1 类比 → 🎬 动画 → 🌲L2 推导 → ✍️ 先做题再看解析 的顺序学；' +
      '做错的题会自动收进错题本。为什么这样学？看「学习方法」页。'));
    var btn = el('button', 'btn-next', '知道了，开始学习');
    btn.type = 'button';
    btn.addEventListener('click', function () {
      try { localStorage.setItem('econ.introSeen', '1'); } catch (e) { /* 忽略 */ }
      if (box.parentNode) box.parentNode.removeChild(box);
    });
    box.appendChild(btn);
    return box;
  }

  /* ---------- 思维导图（可折叠树，默认折叠到章级） ---------- */
  function chapterLi(ch, no, progress, errors, now) {
    var li = el('li', 'mm-ch');
    var btn = el('button', 'mm-ch-btn');
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');

    btn.appendChild(el('span', 'mm-arrow', '▸'));
    var name = el('span', 'mm-ch-name');
    name.appendChild(el('span', 'mm-ch-no', pad2(no)));
    name.appendChild(document.createTextNode(' ' + ch.title));
    btn.appendChild(name);
    btn.appendChild(el('span', 'mm-ch-count',
      chapterDone(ch, progress) + '/' + ch.points.length));
    li.appendChild(btn);

    var pts = el('ul', 'mm-pts');
    ch.points.forEach(function (pt) {
      var pli = el('li');
      var a = el('a', 'mm-pt');
      a.href = pt.id + '.html';
      a.appendChild(markSpan(pt.id, progress, errors, now));
      a.appendChild(document.createTextNode(pt.title));
      pli.appendChild(a);
      pts.appendChild(pli);
    });
    li.appendChild(pts);

    btn.addEventListener('click', function () {
      var open = li.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    return li;
  }

  function toggleAll(tree, open) {
    var items = tree.querySelectorAll('.mm-ch');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('open', open);
      var btn = items[i].querySelector(':scope > .mm-ch-btn');
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  }

  function buildTree(chapters, progress, errors, now) {
    var sec = el('section', 'module');
    var h2 = el('h2');
    h2.appendChild(document.createTextNode('🗺 思维导图 '));
    h2.appendChild(el('span', 'mod-sub',
      '三大板块 → ' + chapters.length + ' 章 → 知识点；点击章名展开 / 收起'));
    sec.appendChild(h2);

    var tools = el('div', 'mm-tools');
    var btnAll = el('button', 'mm-tool-btn', '全部展开');
    var btnNone = el('button', 'mm-tool-btn', '全部收起');
    btnAll.type = 'button'; btnNone.type = 'button';
    tools.appendChild(btnAll); tools.appendChild(btnNone);
    sec.appendChild(tools);

    var tree = el('ul', 'mm-tree');

    /* 按 track 分组，保持 _plan.json 全局顺序 */
    var tracks = [];
    chapters.forEach(function (ch, i) {
      var info = trackInfo(ch.track);
      var bucket = null;
      for (var j = 0; j < tracks.length; j++) if (tracks[j].key === ch.track) bucket = tracks[j];
      if (!bucket) { bucket = { key: ch.track, info: info, items: [] }; tracks.push(bucket); }
      bucket.items.push({ ch: ch, no: i + 1 });
    });

    tracks.forEach(function (bucket) {
      var li = el('li', 'mm-track');
      var head = el('div', 'mm-track-head');
      head.appendChild(el('span', 'badge ' + bucket.info.cls, bucket.info.label));
      head.appendChild(el('span', 'mm-track-name', bucket.info.name));
      var total = 0, done = 0;
      bucket.items.forEach(function (it) {
        total += it.ch.points.length;
        done += chapterDone(it.ch, progress);
      });
      head.appendChild(el('span', 'mm-track-count',
        bucket.items.length + ' 章 · ' + done + '/' + total + ' 已完成'));
      li.appendChild(head);

      var ul = el('ul', 'mm-chs');
      bucket.items.forEach(function (it) {
        ul.appendChild(chapterLi(it.ch, it.no, progress, errors, now));
      });
      li.appendChild(ul);
      tree.appendChild(li);
    });

    sec.appendChild(tree);
    btnAll.addEventListener('click', function () { toggleAll(tree, true); });
    btnNone.addEventListener('click', function () { toggleAll(tree, false); });
    return sec;
  }

  /* ---------- 学习地图（按章分组网格） ---------- */
  function buildMap(chapters, progress, errors, now) {
    var sec = el('section', 'module');
    var h2 = el('h2');
    h2.appendChild(document.createTextNode('🧭 学习地图 '));
    h2.appendChild(el('span', 'mod-sub', '按章浏览全部知识点，徽标显示学习状态'));
    sec.appendChild(h2);

    var lastTrack = null;
    chapters.forEach(function (ch, i) {
      if (ch.track !== lastTrack) {
        lastTrack = ch.track;
        var info = trackInfo(ch.track);
        var th = el('div', 'mm-map-track-head');
        th.appendChild(el('span', 'badge ' + info.cls, info.label));
        th.appendChild(el('span', 'mm-track-name', info.name));
        sec.appendChild(th);
      }

      var wrap = el('div', 'mm-map-ch');
      var h3 = el('h3');
      h3.appendChild(document.createTextNode(pad2(i + 1) + ' · ' + ch.title + ' '));
      h3.appendChild(el('span', 'mm-map-count',
        '本章 ' + chapterDone(ch, progress) + '/' + ch.points.length));
      wrap.appendChild(h3);

      var grid = el('div', 'mm-grid');
      ch.points.forEach(function (pt) {
        var st = stateOf(pt.id, progress, errors, now);
        var card = el('a', 'mm-card st-' + st.key);
        card.href = pt.id + '.html';
        card.appendChild(el('span', 'mm-card-title', pt.title));
        card.appendChild(el('span', 'mm-badge ' + st.cls, st.label));
        if (st.key === 'review') card.appendChild(el('span', 'mm-card-tip', '📌 建议先复习这一讲'));
        grid.appendChild(card);
      });
      wrap.appendChild(grid);
      sec.appendChild(wrap);
    });
    return sec;
  }

  /* ---------- 错题本 ---------- */
  function buildErrorbook(rootEl, idIndex, errors, now) {
    var sec = el('section', 'module');
    var h2 = el('h2');
    h2.appendChild(document.createTextNode('📕 错题本 '));
    h2.appendChild(el('span', 'mod-sub', '做错的题自动收录；7 天内做错的知识点会在地图上标「待复习」'));
    sec.appendChild(h2);

    /* 收集 econ.errors 非空的知识点 */
    var items = [];
    Object.keys(errors).forEach(function (pid) {
      var e = errors[pid] || {};
      var qs = [];
      var latest = 0;
      Object.keys(e).forEach(function (qi) {
        var r = e[qi];
        if (r && ((r.count || 0) > 0 || (r.lastWrongAt || 0) > 0)) {
          qs.push({ qi: parseInt(qi, 10), count: r.count || 0, lastWrongAt: r.lastWrongAt || 0 });
          if ((r.lastWrongAt || 0) > latest) latest = r.lastWrongAt;
        }
      });
      if (qs.length) {
        qs.sort(function (a, b) { return a.qi - b.qi; });
        items.push({ pid: pid, qs: qs, latest: latest });
      }
    });
    items.sort(function (a, b) { return b.latest - a.latest; });

    if (!items.length) {
      sec.appendChild(el('p', 'mm-err-empty', '还没有错题，继续保持！'));
      return sec;
    }

    var ul = el('ul', 'mm-err');
    items.forEach(function (it) {
      var meta = idIndex[it.pid] || { title: it.pid };
      var li = el('li', 'mm-err-item');

      var top = el('div', 'mm-err-top');
      var title = el('a', 'mm-err-title', meta.title);
      title.href = it.pid + '.html';
      top.appendChild(title);
      var redo = el('a', 'mm-btn-redo', '去重做 →');
      redo.href = it.pid + '.html';
      top.appendChild(redo);
      li.appendChild(top);

      var parts = it.qs.map(function (q) {
        return '第 ' + (q.qi + 1) + ' 题 ×' + q.count;
      });
      li.appendChild(el('div', 'mm-err-meta', parts.join(' ｜ ') + ' · 最近错误 ' + fmtDate(it.latest)));
      ul.appendChild(li);
    });
    sec.appendChild(ul);

    var foot = el('div', 'mm-err-foot');
    var btn = el('button', 'mm-btn-clear', '清空错题记录');
    btn.type = 'button';
    btn.addEventListener('click', function () {
      if (!window.confirm('确定清空全部错题记录吗？清空后无法恢复。')) return;
      try { localStorage.removeItem('econ.errors'); } catch (e) { /* 忽略 */ }
      render(rootEl);
    });
    foot.appendChild(btn);
    sec.appendChild(foot);
    return sec;
  }

  /* ---------- 页脚 ---------- */
  function buildFooter() {
    var f = el('footer', 'portal-foot');
    var p = el('p', 'site-note',
      '经济学自学站 · 内容基准：曼昆《经济学原理》《宏观经济学》、高鸿业《西方经济学》、范里安《微观经济学：现代观点》' +
      ' ｜ 引用均来自公开可核验来源 ｜ ');
    var a = el('a', null, '学习方法');
    a.href = 'about.html';
    p.appendChild(a);
    f.appendChild(p);
    return f;
  }

  /* ---------- 页面组装 ---------- */
  function buildPage(rootEl, plan) {
    var chapters = (plan && plan.chapters) || [];
    var progress = readJSON('econ.progress', {});
    var errors = readJSON('econ.errors', {});
    var now = Date.now();

    var idIndex = {};
    chapters.forEach(function (ch) {
      ch.points.forEach(function (pt) { idIndex[pt.id] = { title: pt.title }; });
    });

    rootEl.textContent = '';
    rootEl.appendChild(buildHeader(chapters, progress));
    var guide = buildGuide();
    if (guide) rootEl.appendChild(guide);
    rootEl.appendChild(buildTree(chapters, progress, errors, now));
    rootEl.appendChild(buildMap(chapters, progress, errors, now));
    rootEl.appendChild(buildErrorbook(rootEl, idIndex, errors, now));
    rootEl.appendChild(buildFooter());
  }

  function render(rootEl) {
    if (!rootEl) rootEl = document.getElementById('app');
    if (!rootEl) return;
    fetch('assets/data/_plan.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (plan) { buildPage(rootEl, plan); })
      .catch(function (err) {
        rootEl.textContent = '';
        rootEl.appendChild(el('div', 'error-box',
          '学习地图加载失败（' + err.message + '）。请通过本地 HTTP 服务器或 GitHub Pages 访问本站，' +
          '例如：python3 -m http.server'));
      });
  }

  window.Mindmap = { render: render };

  /* DOMContentLoaded 自动渲染（index.html 静态壳只需 #app 容器） */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { render(null); });
  } else {
    render(null);
  }
})();
