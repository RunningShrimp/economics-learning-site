/* ============================================================
   assets/page.js — 知识点页渲染器（10 模块）
   读取 <body data-chapter="m01" data-point="m01-01">，
   fetch assets/data/_plan.json 与 assets/data/{章id}.json，
   严格按 AGENT_BRIEF §7 的 10 模块顺序渲染。
   依赖：assets/diagrams.js、assets/quiz.js、assets/nav.js（先于本脚本加载）。
   ============================================================ */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var chapterId = document.body.getAttribute('data-chapter') || '';
  var pointId = document.body.getAttribute('data-point') || '';

  /* ---------- 文本工具：转义 + [文本](url) 链接化 ---------- */
  function esc(s0) {
    return String(s0 == null ? '' : s0).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  /* 先整体转义防注入，再把 [文本](url) 转为 <a>；裸 URL 也一并链接化 */
  function mdLinks(s0) {
    var t = esc(s0);
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, function (_m, text, url) {
      return '<a href="' + url + '" target="_blank" rel="noopener">' + text + '</a>';
    });
    t = t.replace(/(^|[\s（(>])((?:https?:\/\/)[^\s<）)"']+)/g, function (_m, pre, url) {
      if (_m.indexOf('href') >= 0) return _m;
      return pre + '<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>';
    });
    return t;
  }

  function showError(msg) {
    if (!app) return;
    app.textContent = '';
    var box = document.createElement('div');
    box.className = 'error-box';
    box.textContent = '页面加载失败：' + msg + '（请刷新重试，或检查 assets/data/ 数据文件是否存在）';
    app.appendChild(box);
  }

  function fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ' 返回 ' + r.status);
      return r.json();
    });
  }

  function render(plan, data) {
    var chapters = (plan && plan.chapters) || [];
    var chapterPlan = null, flatIdx = -1;
    var flat = [];
    chapters.forEach(function (c) {
      (c.points || []).forEach(function (p) { flat.push({ id: p.id, title: p.title, chapter: c }); });
    });
    for (var i = 0; i < flat.length; i++) if (flat[i].id === pointId) { flatIdx = i; break; }
    chapters.forEach(function (c) { if (c.id === chapterId) chapterPlan = c; });
    var point = null, idxInChapter = -1;
    ((data && data.points) || []).forEach(function (p, j) {
      if (p.id === pointId) { point = p; idxInChapter = j; }
    });
    if (!point) { showError('未找到知识点 ' + pointId); return; }
    if (!chapterPlan) { showError('未在 _plan.json 中找到章 ' + chapterId); return; }

    var prev = flatIdx > 0 ? flat[flatIdx - 1] : null;
    var next = (flatIdx >= 0 && flatIdx < flat.length - 1) ? flat[flatIdx + 1] : null;
    var track = str_(chapterPlan.track, 'micro');
    var trackLabel = track === 'macro' ? '宏观' : (track === 'frontier' ? '前沿' : '微观');
    var total = (chapterPlan.points || []).length;
    var chapterTitle = str_(data.title, str_(chapterPlan.title, ''));

    /* ---------- ① 导航条 ---------- */
    function pagerBtn(cls, href, strong, small) {
      return '<a class="pager-btn ' + cls + '" href="' + href + '"><strong>' + esc(strong) + '</strong><small>' + esc(small) + '</small></a>';
    }
    var prevHtml = prev
      ? pagerBtn('prev', prev.id + '.html', '‹ 上一讲', prev.title)
      : '<span class="pager-btn disabled"><strong>‹ 上一讲</strong><small>已是第一讲</small></span>';
    var nextHtml = next
      ? pagerBtn('next', next.id + '.html', '下一讲 ›', next.title)
      : '<span class="pager-btn disabled"><strong>下一讲 ›</strong><small>已是最后一讲</small></span>';

    var html = '';
    html += '<header class="page-head">' +
      '<p class="crumbs"><a href="index.html">经济学自学站</a> / ' + esc(chapterTitle) + '</p>' +
      '<div class="title-row"><span class="badge track-' + esc(track) + '" id="chapter-badge">' + esc(trackLabel) + ' · ' + esc(chapterId.toUpperCase()) + '</span></div>' +
      '<h1>' + esc(point.title) + '</h1>' +
      '<p class="chapter-title">' + esc(chapterTitle) + '</p>' +
      '</header>';

    html += '<section class="module" id="mod-nav">' +
      '<nav class="pager">' + prevHtml +
      '<a class="pager-btn home" href="index.html"><strong>🗺 思维导图</strong><small>全站学习地图</small></a>' +
      nextHtml + '</nav>' +
      '<div class="chapter-progress" id="chapter-progress"></div>' +
      '</section>';

    /* ---------- ② 🌱 L1 ---------- */
    var l1 = point.l1 || {};
    var img = l1.image || {};
    html += '<section class="module" id="mod-l1">' +
      '<h2>🌱 核心概念 <span class="lvl lvl-1">L1 零基础</span></h2>' +
      '<div class="def-box">' + esc(l1.definition || '') + '</div>' +
      '<div class="analogy-box"><span class="box-cap">生活类比</span>' + esc(l1.analogy || '') + '</div>' +
      '<figure class="fig"><div class="fig-host" id="l1-image"></div>' +
      (img.caption ? '<figcaption>' + esc(img.caption) + '</figcaption>' : '') +
      '</figure></section>';

    /* ---------- ③ 📖 真实案例 ---------- */
    var cs = point.case || {};
    html += '<section class="module" id="mod-case">' +
      '<h2>📖 真实案例 <span class="mod-sub">来自现实世界的经济事件</span></h2>' +
      '<div class="case-event">📌 ' + esc(cs.event || '') + '</div>' +
      '<p class="case-facts"><span class="box-cap">事实</span>' + esc(cs.facts || '') + '</p>' +
      '<p class="case-explain"><span class="box-cap">经济学解释</span>' + esc(cs.explain || '') + '</p>' +
      (cs.source_ref ? '<p class="case-src">来源：' + mdLinks(cs.source_ref) + '</p>' : '') +
      '</section>';

    /* ---------- ④ 🎬 交互动画 ---------- */
    var anim = point.animation || {};
    var interactions = Array.isArray(anim.interactions) ? anim.interactions : [];
    html += '<section class="module" id="mod-anim">' +
      '<h2>🎬 交互动画 <span class="mod-sub">动手试一试</span></h2>' +
      '<p class="anim-desc">' + esc(anim.description || '') + '</p>' +
      (interactions.length ? '<ul class="interact-list">' +
        interactions.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
      '<div class="anim-host" id="anim-host"></div>' +
      '</section>';

    /* ---------- ⑤ 🌲 L2 ---------- */
    var l2 = point.l2 || {};
    var pitfalls = Array.isArray(l2.pitfalls) ? l2.pitfalls : [];
    html += '<section class="module" id="mod-l2">' +
      '<h2>🌲 图形推导与考点 <span class="lvl lvl-2">L2 备考</span></h2>' +
      '<pre class="derivation">' + esc(l2.derivation || '') + '</pre>' +
      (l2.exam_tips ? '<div class="exam-tips"><span class="box-cap">考点提示</span>' + esc(l2.exam_tips) + '</div>' : '') +
      (pitfalls.length ? '<ul class="pitfalls">' + pitfalls.map(function (p) {
        var idx = p.indexOf(' → ');
        if (idx < 0) return '<li>' + esc(p) + '</li>';
        return '<li><span class="pit-part-wrong">' + esc(p.slice(0, idx)) + '</span>' +
          '<span class="pit-arrow">→</span><span class="pit-part-right">' + esc(p.slice(idx + 3)) + '</span></li>';
      }).join('') + '</ul>' : '') +
      '</section>';

    /* ---------- ⑥ ⭐ L3 ---------- */
    var l3 = point.l3 || {};
    html += '<section class="module" id="mod-l3">' +
      '<h2>⭐ 中高级数学 <span class="lvl lvl-3">L3 拓展</span></h2>' +
      '<p class="l3-note">以下为考研 / 中高级教材深度的数学表述，学有余力再展开：</p>' +
      '<details class="fold"><summary>展开 L3 数学表述</summary>' +
      '<div class="fold-body"><p class="math-block">' + esc(l3.math || '') + '</p></div>' +
      '</details></section>';

    /* ---------- ⑦ ✍️ 例题区 ---------- */
    html += '<section class="module" id="mod-quiz">' +
      '<h2>✍️ 例题自测 <span class="mod-sub">3 题锁步：全部答对才算完成本讲</span></h2>' +
      '<div id="quiz-area"></div>' +
      '</section>';

    /* ---------- ⑧ 🔗 联系网络 ---------- */
    var links = point.links || {};
    html += '<section class="module" id="mod-links">' +
      '<h2>🔗 联系网络 <span class="mod-sub">这一讲在知识版图中的位置</span></h2>' +
      '<div class="link-grid">' +
      '<div class="link-col from"><h3>⬅ 它从哪来</h3>' + linkList(links.prev, 'from') + '</div>' +
      '<div class="link-col to"><h3>➡ 通向哪里</h3>' + linkList(links.next, 'to') + '</div>' +
      '</div></section>';

    /* ---------- ⑨ 🔬 前沿进展 ---------- */
    var frontier = Array.isArray(point.frontier) ? point.frontier : [];
    var fBody = '';
    frontier.forEach(function (f, fi) {
      var finding = str_(f.finding, '');
      if (finding.indexOf('本节暂未纳入') === 0) {
        fBody += '<p class="frontier-empty">' + esc(finding) + '</p>';
        return;
      }
      fBody += '<details class="fold"><summary>🔬 研究 ' + (fi + 1) + '：' + esc(truncate(finding, 34)) + '</summary>' +
        '<div class="fold-body">' +
        '<p class="frontier-finding">' + esc(finding) + '</p>' +
        (str_(f.controversy, '') ? '<p class="frontier-controversy"><span class="tag-dispute">学界尚有争议</span>' + esc(f.controversy) + '</p>' : '') +
        (str_(f.citation, '') ? '<p class="frontier-citation">来源：' + mdLinks(f.citation) + '</p>' : '') +
        '</div></details>';
    });
    html += '<section class="module" id="mod-frontier">' +
      '<h2>🔬 前沿进展 <span class="mod-sub">' + (frontier.length ? frontier.length + ' 条近年研究' : '') + '</span></h2>' +
      (fBody || '<p class="frontier-empty">本节暂未纳入近年研究。</p>') +
      '</section>';

    /* ---------- ⑩ 🔊 朗读 + 页脚参考来源 ---------- */
    var refs = Array.isArray(point.references) ? point.references : [];
    html += '<section class="module" id="mod-speak">' +
      '<h2>🔊 语音朗读 <span class="mod-sub">听一遍核心概念</span></h2>' +
      '<div class="read-row">' +
      '<button type="button" class="btn-speak" id="speak-btn">🔊 朗读核心概念</button>' +
      '<span class="speak-status" id="speak-status"></span>' +
      '<p class="speak-note">使用浏览器内置语音（zh-CN）朗读本讲的定义与类比；再次点击可停止。</p>' +
      '</div></section>';

    html += '<footer class="refs"><h2>本页参考来源</h2><ol>' +
      (refs.length ? refs.map(function (r) { return '<li>' + mdLinks(r) + '</li>'; }).join('') : '<li>（本页未列出参考来源）</li>') +
      '</ol><p class="site-note">经济学自学站 · 内容仅供学习参考 · 引用以原文链接为准</p></footer>';

    app.textContent = '';
    var wrap = document.createElement('div');
    wrap.id = 'page-wrap';
    wrap.innerHTML = html;
    while (wrap.firstChild) app.appendChild(wrap.firstChild);

    /* ---------- 动态行为 ---------- */
    // ①章进度条（nav.js）；quiz 完成时（econ:progress 事件）实时刷新
    function refreshChapterProgress() {
      if (window.Nav && typeof window.Nav.renderChapterProgress === 'function') {
        window.Nav.renderChapterProgress(document.getElementById('chapter-progress'), chapterPlan, idxInChapter + 1);
      }
    }
    refreshChapterProgress();
    document.addEventListener('econ:progress', refreshChapterProgress);
    if (window.Nav && typeof window.Nav.markVisited === 'function') {
      window.Nav.markVisited(pointId);
    }
    // ②示意图
    if (window.Diagrams) window.Diagrams.renderImage(document.getElementById('l1-image'), img);
    // ④动画
    if (window.Diagrams) window.Diagrams.renderAnimation(document.getElementById('anim-host'), anim);
    // ⑦例题
    if (window.Quiz && document.getElementById('quiz-area')) {
      window.Quiz.render(document.getElementById('quiz-area'), point);
    } else if (document.getElementById('quiz-area')) {
      document.getElementById('quiz-area').textContent = '（例题组件加载失败）';
    }
    // ⑩朗读
    wireSpeak(l1);
    // 离开页面时停止朗读
    window.addEventListener('beforeunload', function () {
      try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* 忽略 */ }
    });
  }

  function str_(v, d) { return (typeof v === 'string' && v.length) ? v : (d || ''); }
  function truncate(s0, n) { s0 = String(s0); return s0.length > n ? s0.slice(0, n) + '…' : s0; }

  function linkList(entries, side) {
    if (!Array.isArray(entries) || !entries.length) {
      return '<p class="link-empty">' + (side === 'from'
        ? '本讲没有前置知识点（很可能是全站起点，直接开始吧）。'
        : '本讲没有标注后继知识点（可能是该主线的终点）。') + '</p>';
    }
    var planMap = window.__econPlanMap || {};
    return '<ul>' + entries.map(function (e) {
      var s0 = String(e == null ? '' : e);
      var i = s0.indexOf('|');
      var id = i < 0 ? s0 : s0.slice(0, i);
      var note = i < 0 ? '' : s0.slice(i + 1);
      var meta = planMap[id];
      var title = meta ? meta.title : id;
      return '<li><a href="' + esc(id) + '.html">' + esc(title) + '</a>' +
        (note ? '<span class="link-note">' + esc(note) + '</span>' : '') + '</li>';
    }).join('') + '</ul>';
  }

  function wireSpeak(l1) {
    var btn = document.getElementById('speak-btn');
    var status = document.getElementById('speak-status');
    if (!btn) return;
    var synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
      btn.disabled = true;
      if (status) status.textContent = '（当前浏览器不支持语音朗读）';
      return;
    }
    var speaking = false;
    function setOff(msg) {
      speaking = false;
      btn.textContent = '🔊 朗读核心概念';
      btn.classList.remove('speaking');
      if (status) status.textContent = msg || '';
    }
    btn.addEventListener('click', function () {
      if (speaking) {
        synth.cancel();
        setOff('已停止。');
        return;
      }
      var text = str_(l1 && l1.definition, '') + '　' + str_(l1 && l1.analogy, '');
      if (!text.trim()) { setOff('（本讲没有可朗读的内容）'); return; }
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 1;
      u.onend = function () { setOff('朗读完毕。'); };
      u.onerror = function () { setOff('朗读失败（浏览器语音不可用）。'); };
      synth.cancel();
      synth.speak(u);
      speaking = true;
      btn.textContent = '⏹ 停止朗读';
      btn.classList.add('speaking');
      if (status) status.textContent = '正在朗读…';
    });
  }

  /* ---------- 启动 ---------- */
  if (!chapterId || !pointId) {
    showError('页面缺少 data-chapter / data-point 属性');
    return;
  }
  Promise.all([
    fetchJSON('assets/data/_plan.json'),
    fetchJSON('assets/data/' + encodeURIComponent(chapterId) + '.json')
  ]).then(function (rs) {
    var plan = rs[0], data = rs[1];
    // 供 linkList 使用：全局 id → {title}
    var map = {};
    ((plan && plan.chapters) || []).forEach(function (c) {
      (c.points || []).forEach(function (p) { map[p.id] = { title: p.title, chapter: c.id }; });
    });
    window.__econPlanMap = map;
    render(plan, data);
  }).catch(function (err) {
    if (window.console && console.error) console.error(err);
    showError(err && err.message ? err.message : '数据加载失败');
  });
})();
