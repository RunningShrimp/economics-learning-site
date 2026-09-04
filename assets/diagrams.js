/* ============================================================
   assets/diagrams.js — 示意图目录（4 类）+ 交互动画目录（8 类）
   纯 SVG + 原生 JS，零依赖；触屏可用（Pointer Events）；
   params 缺省时使用兜底默认值，渲染异常时降级为提示框，不阻断页面。
   对外：window.Diagrams.renderImage(containerEl, imageSpec)
         window.Diagrams.renderAnimation(containerEl, animSpec)
   ============================================================ */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var C = {
    ink: '#1e293b', muted: '#64748b', grid: '#e5eaf2', axis: '#334155',
    indigo: '#4f46e5', indigoSoft: '#e0e7ff', teal: '#0d9488', tealSoft: '#ccfbf1',
    orange: '#ea580c', purple: '#7c3aed', red: '#dc2626', handle: '#f59e0b'
  };

  /* ---------------- 通用工具 ---------------- */
  function num(v, d) { var n = Number(v); return isFinite(n) ? n : d; }
  function str(v, d) { return (typeof v === 'string' && v.length) ? v : (d || ''); }
  function arr(v, d) { return Array.isArray(v) && v.length ? v : (d || []); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function s(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    return e;
  }
  function txt(parent, x, y, text, o) {
    o = o || {};
    var t = s('text', {
      x: x, y: y,
      'font-size': o.size || 13,
      fill: o.fill || C.ink,
      'text-anchor': o.anchor || 'start',
      'font-weight': o.weight || 'normal'
    });
    if (o.transform) t.setAttribute('transform', o.transform);
    t.textContent = String(text);
    parent.appendChild(t);
    return t;
  }
  function wrapCJK(text, n) {
    var s0 = String(text), out = [];
    for (var i = 0; i < s0.length; i += n) out.push(s0.slice(i, i + n));
    return out;
  }
  function fmt(v) {
    if (typeof v !== 'number' || !isFinite(v)) return '—';
    var r = Math.round(v);
    return Math.abs(v - r) < 1e-9 ? String(r) : String(+v.toFixed(1));
  }
  function niceTicks(lo, hi, count) {
    var span = (hi - lo) || 1;
    var step = Math.pow(10, Math.floor(Math.log(span / count) / Math.LN10));
    var err = span / count / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var out = [], v = Math.ceil(lo / step) * step;
    for (; v <= hi + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-6 ? 0 : +v.toFixed(6));
    return out;
  }

  var uid = 0;

  /* 坐标系画框：坐标轴 + 刻度 + 网格 + 轴名；返回数据→像素映射 */
  function chartFrame(W, H, m, xLabel, yLabel, opts) {
    opts = opts || {};
    var svg = s('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', class: 'd-chart' });
    var plot = { x0: m.l, y0: m.t, x1: W - m.r, y1: H - m.b };
    var mk = 'arw' + (++uid);
    var defs = s('defs');
    var marker = s('marker', { id: mk, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
    marker.appendChild(s('path', { d: 'M0,0 L10,5 L0,10 z', fill: C.axis }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    svg.setDomain = function (xmin, xmax, ymin, ymax) {
      var X = function (v) { return plot.x0 + (v - xmin) / ((xmax - xmin) || 1) * (plot.x1 - plot.x0); };
      var Y = function (v) { return plot.y1 - (v - ymin) / ((ymax - ymin) || 1) * (plot.y1 - plot.y0); };
      var g = s('g');
      if (opts.grid !== false) {
        niceTicks(ymin, ymax, 4).forEach(function (t) {
          if (t <= ymin + 1e-9) return;
          g.appendChild(s('line', { x1: plot.x0, y1: Y(t), x2: plot.x1, y2: Y(t), stroke: C.grid, 'stroke-width': 1 }));
        });
        niceTicks(xmin, xmax, 5).forEach(function (t) {
          if (t <= xmin + 1e-9) return;
          g.appendChild(s('line', { x1: X(t), y1: plot.y0, x2: X(t), y2: plot.y1, stroke: C.grid, 'stroke-width': 1 }));
        });
      }
      g.appendChild(s('line', { x1: plot.x0, y1: plot.y1, x2: plot.x1 + 8, y2: plot.y1, stroke: C.axis, 'stroke-width': 1.6, 'marker-end': 'url(#' + mk + ')' }));
      g.appendChild(s('line', { x1: plot.x0, y1: plot.y1, x2: plot.x0, y2: plot.y0 - 8, stroke: C.axis, 'stroke-width': 1.6, 'marker-end': 'url(#' + mk + ')' }));
      niceTicks(xmin, xmax, 5).forEach(function (t) {
        txt(g, X(t), plot.y1 + 16, fmt(t), { size: 11, fill: C.muted, anchor: 'middle' });
      });
      niceTicks(ymin, ymax, 4).forEach(function (t) {
        if (t === 0) return;
        txt(g, plot.x0 - 6, Y(t) + 4, fmt(t), { size: 11, fill: C.muted, anchor: 'end' });
      });
      txt(g, plot.x0 - 5, plot.y1 + 16, '0', { size: 11, fill: C.muted, anchor: 'end' });
      if (xLabel) txt(g, plot.x1 + 4, plot.y1 + 32, xLabel, { size: 12.5, anchor: 'end', weight: '600' });
      if (yLabel) txt(g, 0, 0, yLabel, {
        size: 12.5, anchor: 'middle', weight: '600',
        transform: 'translate(' + (m.l - 38) + ',' + ((plot.y0 + plot.y1) / 2) + ') rotate(-90)'
      });
      svg.appendChild(g);
      return { X: X, Y: Y, plot: plot };
    };
    svg._plot = plot;
    return svg;
  }

  /* client 坐标 → svg 本地坐标 */
  function toLocal(svg, e) {
    try {
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var mtx = svg.getScreenCTM();
      if (mtx) { var p = pt.matrixTransform(mtx.inverse()); return { x: p.x, y: p.y }; }
    } catch (err) { /* fallthrough */ }
    var r = svg.getBoundingClientRect();
    var vb = (svg.viewBox && svg.viewBox.baseVal) || { width: r.width || 1, height: r.height || 1 };
    return {
      x: (e.clientX - r.left) * (vb.width / (r.width || 1)),
      y: (e.clientY - r.top) * (vb.height / (r.height || 1))
    };
  }

  /* 拖拽封装（Pointer Events，触屏可用）：start/move/end 收到 svg 本地坐标 */
  function onDrag(target, svg, handlers) {
    var active = false;
    target.style.touchAction = 'none';
    target.addEventListener('pointerdown', function (e) {
      active = true;
      try { if (target.setPointerCapture) target.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
      if (handlers.start) handlers.start(toLocal(svg, e), e);
      e.preventDefault();
    });
    target.addEventListener('pointermove', function (e) {
      if (!active) return;
      if (handlers.move) handlers.move(toLocal(svg, e), e);
      e.preventDefault();
    });
    function up() { if (!active) return; active = false; if (handlers.end) handlers.end(); }
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
    target.addEventListener('lostpointercapture', up);
  }

  /* 线性曲线 P = a + b·Q */
  function lineOf(o, da, db) {
    o = o || {};
    return { a: num(o.a, da), b: (o.b === 0 ? 0 : num(o.b, db)) };
  }
  function xsect(l1, l2) {
    var db = l1.b - l2.b;
    if (Math.abs(db) < 1e-9) return null;
    var q = (l2.a - l1.a) / db;
    return { q: q, p: l1.a + l1.b * q };
  }
  function domainFor(lines, extraX) {
    var xs = [10];
    lines.forEach(function (L) {
      if (L.b < -1e-9) xs.push(-L.a / L.b);
      else if (L.b > 1e-9) xs.push(Math.max(0, -L.a / L.b) + 24);
    });
    (extraX || []).forEach(function (x) { if (isFinite(x) && x > 0) xs.push(x); });
    var xmax = clamp(Math.max.apply(null, xs) * 1.14, 16, 2000);
    var ys = [10];
    lines.forEach(function (L) {
      [0, xmax].forEach(function (x) { var p = L.a + L.b * x; if (isFinite(p)) ys.push(p); });
    });
    var ymax = clamp(Math.max.apply(null, ys) * 1.14, 16, 2000);
    return { xmin: 0, xmax: xmax, ymin: 0, ymax: ymax };
  }
  function sampleLine(L, dom, X, Y, N) {
    N = N || 80;
    var pts = [];
    for (var i = 0; i <= N; i++) {
      var x = dom.xmin + (dom.xmax - dom.xmin) * i / N;
      var p = L.a + L.b * x;
      if (p >= dom.ymin - 1e-9 && p <= dom.ymax + 1e-9) pts.push([X(x), Y(p)]);
    }
    return pts;
  }
  function pathFrom(pts) {
    if (!pts || pts.length < 2) return '';
    return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
  }
  /* 拖动截距 a 时，把交点约束回图内（从初始 a0 方向回退到可行边界） */
  function feasibleA(a, meB, other, dom, a0) {
    function ok(v) {
      var ip = xsect({ a: v, b: meB }, other);
      return !!ip && ip.q > dom.xmax * 0.06 && ip.q < dom.xmax * 0.94 &&
             ip.p > dom.ymax * 0.07 && ip.p < dom.ymax * 0.93;
    }
    a = clamp(a, a0 - 80, a0 + 80);
    if (ok(a)) return a;
    var step = a > a0 ? -0.5 : 0.5, v = a;
    for (var i = 0; i < 400; i++) {
      v += step;
      if (ok(v)) return v;
      if ((step < 0 && v <= a0) || (step > 0 && v >= a0)) break;
    }
    return a0;
  }

  /* 双线拖拽核心（sd-shift / ad-as 共用） */
  function linesWidget(host, cfg) {
    var W = Math.max(300, Math.min(host.clientWidth || 640, 720)), H = 330;
    var m = { l: 56, r: 22, t: 18, b: 48 };
    var dom = domainFor([cfg.l1, cfg.l2], cfg.lrasX ? [cfg.lrasX * 1.35] : []);
    var svg = chartFrame(W, H, m, cfg.xLabel, cfg.yLabel);
    var sc = svg.setDomain(dom.xmin, dom.xmax, dom.ymin, dom.ymax);
    host.appendChild(svg);

    if (cfg.lrasX != null) {
      var lx = sc.X(num(cfg.lrasX, dom.xmax * 0.5));
      svg.appendChild(s('line', { x1: lx, y1: sc.Y(dom.ymax * 0.97), x2: lx, y2: sc.plot.y1, stroke: C.purple, 'stroke-width': 2, 'stroke-dasharray': '7 5' }));
      txt(svg, lx + 6, sc.Y(dom.ymax * 0.97) + 14, cfg.lrasLabel || 'LRAS', { size: 11.5, fill: C.purple, weight: '600' });
    }

    var st = { a1: cfg.l1.a, a2: cfg.l2.a };
    function cur(key) { return key === 1 ? { a: st.a1, b: cfg.l1.b } : { a: st.a2, b: cfg.l2.b }; }

    var v1 = s('path', { fill: 'none', stroke: cfg.color1 || C.indigo, 'stroke-width': 3.4, 'stroke-linecap': 'round' });
    var v2 = s('path', { fill: 'none', stroke: cfg.color2 || C.teal, 'stroke-width': 3.4, 'stroke-linecap': 'round' });
    svg.appendChild(v1); svg.appendChild(v2);

    var eqG = s('g');
    var eqDot = s('circle', { r: 6, fill: C.orange, stroke: '#fff', 'stroke-width': 2 });
    var eqLbl = txt(eqG, 0, 0, '', { size: 12.5, fill: C.orange, weight: '700' });
    svg.appendChild(eqG);

    /* 可拖曲线：可视线 + 命中热区 + 圆点手柄，统一增量拖拽 */
    function addDraggable(key, label) {
      var hit = s('path', { d: '', fill: 'none', stroke: 'rgba(0,0,0,0)', 'stroke-width': 30, 'pointer-events': 'stroke', class: 'd-hit' });
      var handle = s('circle', { r: 7.5, fill: '#fff', stroke: C.handle, 'stroke-width': 3.5, class: 'd-hit' });
      svg.appendChild(hit); svg.appendChild(handle);
      var lastY = null;
      function onStart(pt) { lastY = pt.y; }
      function onMove(pt) {
        if (lastY == null) lastY = pt.y;
        var dy = lastY - pt.y;
        lastY = pt.y;
        if (!dy) return;
        var other = cur(key === 1 ? 2 : 1);
        if (key === 1) st.a1 = feasibleA(st.a1 + dy, cfg.l1.b, other, dom, cfg.l1.a);
        else st.a2 = feasibleA(st.a2 + dy, cfg.l2.b, other, dom, cfg.l2.a);
        refresh();
      }
      onDrag(hit, svg, { start: onStart, move: onMove, end: function () { lastY = null; } });
      onDrag(handle, svg, { start: onStart, move: onMove, end: function () { lastY = null; } });
      return {
        refresh: function () {
          var pts = sampleLine(cur(key), dom, sc.X, sc.Y, 40);
          hit.setAttribute('d', pathFrom(pts));
          if (pts.length > 1) {
            var mid = pts[Math.floor(pts.length / 2)];
            handle.setAttribute('cx', mid[0]); handle.setAttribute('cy', mid[1]);
            handle.setAttribute('display', '');
          } else {
            handle.setAttribute('display', 'none');
          }
        },
        label: label
      };
    }
    var drag1 = cfg.drag1 ? addDraggable(1, cfg.label1) : null;
    var drag2 = cfg.drag2 ? addDraggable(2, cfg.label2) : null;

    function refresh() {
      v1.setAttribute('d', pathFrom(sampleLine(cur(1), dom, sc.X, sc.Y)));
      v2.setAttribute('d', pathFrom(sampleLine(cur(2), dom, sc.X, sc.Y)));
      if (drag1) drag1.refresh();
      if (drag2) drag2.refresh();
      var ip = xsect(cur(1), cur(2));
      if (ip && ip.q >= dom.xmin && ip.q <= dom.xmax && ip.p >= dom.ymin && ip.p <= dom.ymax) {
        eqG.setAttribute('display', '');
        eqDot.setAttribute('cx', sc.X(ip.q)); eqDot.setAttribute('cy', sc.Y(ip.p));
        eqG.appendChild(eqDot);
        eqLbl.setAttribute('x', sc.X(ip.q) + 10);
        eqLbl.setAttribute('y', sc.Y(ip.p) - 10);
        eqLbl.textContent = cfg.eqLabel + '（' + fmt(ip.q) + ', ' + fmt(ip.p) + '）';
        eqG.appendChild(eqLbl);
        if (cfg.readout) cfg.readout.textContent = cfg.readoutFn(ip.q, ip.p, st);
      } else {
        eqG.setAttribute('display', 'none');
      }
    }
    refresh();
  }

  /* ============================================================
     一、示意图（静态 4 类）
     ============================================================ */
  var images = {

    /* two-lines-intersection：两条线 + 交点（示意图，无刻度） */
    'two-lines-intersection': function (host, P) {
      var W = Math.max(300, Math.min(host.clientWidth || 620, 640)), H = 330;
      var m = { l: 50, r: 26, t: 20, b: 48 };
      var svg = chartFrame(W, H, m, str(P.xLabel, '数量 Q'), str(P.yLabel, '价格 P'), { grid: false });
      var pl = svg._plot;
      var pad = 52;
      function drawLine(dir, color, label, labelAnchorStart) {
        var x0, y0, x1, y1;
        if (dir === 'down') { x0 = pl.x0 + pad * 0.7; y0 = pl.y0 + pad * 0.55; x1 = pl.x1 - pad * 0.5; y1 = pl.y1 - pad * 0.55; }
        else { x0 = pl.x0 + pad * 0.7; y0 = pl.y1 - pad * 0.55; x1 = pl.x1 - pad * 0.5; y1 = pl.y0 + pad * 0.55; }
        svg.appendChild(s('line', { x1: x0, y1: y0, x2: x1, y2: y1, stroke: color, 'stroke-width': 3.6, 'stroke-linecap': 'round' }));
        var lx = labelAnchorStart ? x0 - 6 : x0 + 4;
        var ly = labelAnchorStart ? (dir === 'down' ? y0 - 12 : y0 + 22) : (dir === 'down' ? y0 - 12 : y0 + 22);
        var t = txt(svg, lx, ly, label, { size: 13.5, fill: color, weight: '700' });
        if (!labelAnchorStart) t.setAttribute('x', x1 - 4), t.setAttribute('text-anchor', 'end'), t.setAttribute('y', y1 + (dir === 'down' ? 22 : -12));
        return [[x0, y0], [x1, y1]];
      }
      var dirA = str(P.aDir, 'down') === 'up' ? 'up' : 'down';
      var dirB = str(P.bDir, 'up') === 'down' ? 'down' : 'up';
      var A = drawLine(dirA, C.indigo, str(P.aLabel, '曲线 A'), true);
      var B = drawLine(dirB, C.teal, str(P.bLabel, '曲线 B'), false);
      // 线段交点
      function inter(p, q) {
        var d = (p[0][0] - p[1][0]) * (q[0][1] - q[1][1]) - (p[0][1] - p[1][1]) * (q[0][0] - q[1][0]);
        if (Math.abs(d) < 1e-9) return null;
        var t = ((q[0][0] - p[0][0]) * (q[0][1] - q[1][1]) - (q[0][1] - p[0][1]) * (q[0][0] - q[1][0])) / d;
        return [p[0][0] + t * (p[1][0] - p[0][0]), p[0][1] + t * (p[1][1] - p[0][1])];
      }
      var ip = inter(A, B) || [(pl.x0 + pl.x1) / 2, (pl.y0 + pl.y1) / 2];
      svg.appendChild(s('circle', { cx: ip[0], cy: ip[1], r: 6.5, fill: C.orange, stroke: '#fff', 'stroke-width': 2.5 }));
      txt(svg, ip[0] + 12, ip[1] - 10, str(P.pointLabel, '均衡点'), { size: 13, fill: C.orange, weight: '700' });
      host.appendChild(svg);
    },

    /* flow-loop：闭环流程（循环流量图等） */
    'flow-loop': function (host, P) {
      var nodes = arr(P.nodes, ['主体 A', '主体 B', '主体 C', '主体 D']).map(function (x) { return str(x, '节点'); });
      var W = Math.max(300, Math.min(host.clientWidth || 620, 640)), H = 330;
      var svg = s('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', class: 'd-flow' });
      var mk = 'flw' + (++uid);
      var defs = s('defs');
      var marker = s('marker', { id: mk, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7.5, markerHeight: 7.5, orient: 'auto' });
      marker.appendChild(s('path', { d: 'M0,0 L10,5 L0,10 z', fill: C.teal }));
      defs.appendChild(marker);
      svg.appendChild(defs);
      var cx = W / 2, cy = H / 2, rx = Math.min(W * 0.31, 225), ry = H * 0.32;
      svg.appendChild(s('ellipse', { cx: cx, cy: cy, rx: rx, ry: ry, fill: 'none', stroke: C.grid, 'stroke-width': 2, 'stroke-dasharray': '4 6' }));
      var n = nodes.length, pos = [], bw = [], bh = 40;
      for (var i = 0; i < n; i++) {
        var ang = -Math.PI / 2 + i * 2 * Math.PI / n;
        pos.push([cx + rx * Math.cos(ang), cy + ry * Math.sin(ang)]);
        bw.push(clamp(nodes[i].length * 14.5 + 28, 76, 210));
      }
      function ep(a, f) { return [cx + rx * f * Math.cos(a), cy + ry * f * Math.sin(a)]; }
      for (var j = 0; j < n; j++) {
        var k = (j + 1) % n;
        var aj = -Math.PI / 2 + j * 2 * Math.PI / n, ak = -Math.PI / 2 + k * 2 * Math.PI / n;
        var gap = Math.min(0.52, Math.PI / n * 0.55);
        var p1 = ep(aj + gap, 1), p2 = ep(ak - gap, 1);
        var am = (aj + ak) / 2;
        if (ak < aj) am += Math.PI;
        var pc = ep(am, 1.3);
        svg.appendChild(s('path', {
          d: 'M' + p1[0].toFixed(1) + ',' + p1[1].toFixed(1) + ' Q' + pc[0].toFixed(1) + ',' + pc[1].toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1),
          fill: 'none', stroke: C.teal, 'stroke-width': 3, 'marker-end': 'url(#' + mk + ')'
        }));
      }
      for (var t = 0; t < n; t++) {
        var g = s('g');
        g.appendChild(s('rect', { x: pos[t][0] - bw[t] / 2, y: pos[t][1] - bh / 2, width: bw[t], height: bh, rx: 10, fill: '#fff', stroke: C.indigo, 'stroke-width': 2 }));
        txt(g, pos[t][0], pos[t][1] + 5, nodes[t], { size: 14, fill: C.indigo, anchor: 'middle', weight: '700' });
        svg.appendChild(g);
      }
      host.appendChild(svg);
    },

    /* bars：柱状对比 */
    'bars': function (host, P) {
      var items = arr(P.items, [{ label: 'A', value: 5 }, { label: 'B', value: 3 }]).map(function (it) {
        return { label: str(it && it.label, '项'), value: num(it && it.value, 0) };
      });
      var W = Math.max(300, Math.min(host.clientWidth || 620, 640));
      var H = 310, m = { l: 54, r: 18, t: 26, b: 84 };
      var svg = chartFrame(W, H, m, str(P.xLabel, ''), str(P.yLabel, ''));
      var pl = svg._plot;
      var maxV = Math.max.apply(null, items.map(function (d) { return d.value; }).concat([1]));
      var sc = svg.setDomain(0, items.length, 0, maxV * 1.12);
      var slot = (pl.x1 - pl.x0) / items.length;
      var barW = clamp(slot * 0.5, 26, 72);
      items.forEach(function (d, i) {
        var x = pl.x0 + slot * i + (slot - barW) / 2;
        var yTop = sc.Y(Math.max(d.value, 0)), y0 = sc.Y(0);
        var bar = s('rect', { x: x, y: Math.min(yTop, y0 - 3), width: barW, height: Math.max(3, Math.abs(y0 - yTop)), rx: 5, fill: C.teal, opacity: 0.92 });
        var title = s('title'); title.textContent = d.label + '：' + fmt(d.value);
        bar.appendChild(title);
        svg.appendChild(bar);
        txt(svg, x + barW / 2, Math.min(yTop, y0 - 3) - 7, fmt(d.value), { size: 12.5, anchor: 'middle', weight: '700' });
        wrapCJK(d.label, 8).slice(0, 3).forEach(function (ln, li) {
          txt(svg, x + barW / 2, y0 + 17 + li * 14, ln, { size: 11, fill: C.muted, anchor: 'middle' });
        });
      });
      host.appendChild(svg);
    },

    /* matrix：2×2（或 m×n）结构/收益矩阵 */
    'matrix': function (host, P) {
      var rows = arr(P.rowLabels, ['行 1', '行 2']).map(function (x) { return str(x, ''); });
      var cols = arr(P.colLabels, ['列 1', '列 2']).map(function (x) { return str(x, ''); });
      var cells = Array.isArray(P.cells) ? P.cells : [];
      var nR = rows.length, nC = cols.length;
      function cellText(r, c) {
        return (cells[r] && cells[r][c] != null) ? String(cells[r][c]) : '';
      }
      var maxRow = 0, maxCell = 0;
      rows.forEach(function (r) { maxRow = Math.max(maxRow, r.length); });
      for (var r = 0; r < nR; r++) for (var c = 0; c < nC; c++) maxCell = Math.max(maxCell, cellText(r, c).length);
      var colW = clamp(maxCell * 12.5 + 30, 150, 320);
      var rowW = clamp(maxRow * 13 + 28, 96, 200);
      var charsPerLine = Math.max(6, Math.floor((colW - 28) / 12.5));
      var maxLines = 1;
      for (var r2 = 0; r2 < nR; r2++) for (var c3 = 0; c3 < nC; c3++) maxLines = Math.max(maxLines, wrapCJK(cellText(r2, c3), charsPerLine).length);
      maxLines = Math.min(maxLines, 4);
      var rowH = clamp(maxLines * 17 + 22, 58, 120);
      var headH = 48;
      var W = rowW + colW * nC + 24, H = headH + rowH * nR + 20;
      var svg = s('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', class: 'd-matrix' });
      var x0 = 12, y0 = 10;
      for (var cc = 0; cc < nC; cc++) {
        var cx0 = x0 + rowW + cc * colW;
        svg.appendChild(s('rect', { x: cx0 + 2, y: y0, width: colW - 4, height: headH - 8, rx: 8, fill: C.indigoSoft }));
        var lines = wrapCJK(cols[cc], Math.max(6, Math.floor((colW - 30) / 13))).slice(0, 2);
        lines.forEach(function (ln, li) {
          txt(svg, cx0 + colW / 2, y0 + (headH - 8) / 2 + 5 - (lines.length - 1) * 8 + li * 16, ln,
            { size: 13.5, fill: C.indigo, anchor: 'middle', weight: '700' });
        });
      }
      for (var rr = 0; rr < nR; rr++) {
        var ry = y0 + headH + rr * rowH;
        svg.appendChild(s('rect', { x: x0, y: ry + 2, width: rowW - 8, height: rowH - 4, rx: 8, fill: C.tealSoft }));
        var rlines = wrapCJK(rows[rr], Math.max(5, Math.floor((rowW - 30) / 13))).slice(0, 2);
        rlines.forEach(function (ln, li) {
          txt(svg, x0 + (rowW - 8) / 2, ry + rowH / 2 + 5 - (rlines.length - 1) * 8 + li * 16, ln,
            { size: 13.5, fill: '#0f766e', anchor: 'middle', weight: '700' });
        });
        for (var c2 = 0; c2 < nC; c2++) {
          var cx2 = x0 + rowW + c2 * colW;
          svg.appendChild(s('rect', { x: cx2 + 2, y: ry + 2, width: colW - 4, height: rowH - 4, rx: 8, fill: '#fff', stroke: C.grid, 'stroke-width': 1.5 }));
          var body = wrapCJK(cellText(rr, c2), charsPerLine).slice(0, 4);
          body.forEach(function (ln, li) {
            txt(svg, cx2 + colW / 2, ry + rowH / 2 + 5 - (body.length - 1) * 8 + li * 16, ln,
              { size: 12.5, anchor: 'middle' });
          });
        }
      }
      host.appendChild(svg);
    }
  };

  /* ============================================================
     二、交互动画（8 类；全部支持拖拽 / 滑杆 / 点击）
     ============================================================ */
  function animWidget(host) {
    var box = h('div', 'anim-widget');
    var svgWrap = h('div', 'anim-svg');
    var controls = h('div', 'anim-controls');
    var readout = h('div', 'anim-readout');
    var hint = h('div', 'anim-hint');
    box.appendChild(svgWrap); box.appendChild(controls); box.appendChild(readout); box.appendChild(hint);
    host.appendChild(box);
    return { box: box, svgWrap: svgWrap, controls: controls, readout: readout, hint: hint };
  }
  function addSlider(w, label, min, max, step, value, onInput) {
    var wrap = h('div', 'ctrl');
    var lab = h('label', null, label);
    var input = document.createElement('input');
    input.type = 'range';
    input.min = min; input.max = max; input.step = step; input.value = value;
    input.setAttribute('aria-label', label);
    var out = document.createElement('output');
    out.textContent = fmt(Number(value));
    input.addEventListener('input', function () {
      out.textContent = fmt(Number(input.value));
      onInput(Number(input.value));
    });
    wrap.appendChild(lab); wrap.appendChild(input); wrap.appendChild(out);
    w.controls.appendChild(wrap);
    return input;
  }

  var animations = {

    /* sd-shift：供求均衡与移动（竖直拖动一条曲线的截距） */
    'sd-shift': function (host, P) {
      var w = animWidget(host);
      var demand = lineOf(P.demand, 100, -2);
      var supply = lineOf(P.supply, 20, 2);
      var draggable = str(P.draggable, 'demand') === 'supply' ? 'supply' : 'demand';
      var xL = str(P.xLabel, '数量 Q'), yL = str(P.yLabel, '价格 P');
      linesWidget(w.svgWrap, {
        l1: demand, l2: supply,
        drag1: draggable === 'demand', drag2: draggable === 'supply',
        color1: C.indigo, color2: C.teal,
        eqLabel: '均衡 E',
        xLabel: xL, yLabel: yL,
        readout: w.readout,
        readoutFn: function (q, p) {
          return '均衡 E：' + xL + ' = ' + fmt(q) + '，' + yL + ' = ' + fmt(p) +
            '　（' + (draggable === 'demand' ? '需求' : '供给') + '曲线整体上/下移 → 均衡点随之移动）';
        }
      });
      w.hint.textContent = '👆 竖直拖动' + (draggable === 'demand' ? '蓝色需求曲线（或其上的橙色圆点手柄）' : '青色供给曲线（或其上的橙色圆点手柄）') + '，观察均衡变化';
    },

    /* ad-as：AD-AS 模型（AD 与 SRAS 均可拖动，含 LRAS 竖线） */
    'ad-as': function (host, P) {
      var w = animWidget(host);
      var ad = lineOf(P.ad, 140, -2);
      var sras = lineOf(P.sras, 30, 2);
      var lrasX = num(P.lrasX, 40);
      var xL = str(P.xLabel, '总产出 Y'), yL = str(P.yLabel, '价格水平 P');
      linesWidget(w.svgWrap, {
        l1: ad, l2: sras, drag1: true, drag2: true,
        color1: C.indigo, color2: C.teal,
        eqLabel: '短期均衡',
        lrasX: lrasX, lrasLabel: 'LRAS（潜在产出）',
        xLabel: xL, yLabel: yL,
        readout: w.readout,
        readoutFn: function (q, p, st) {
          var a1 = st ? st.a1 : ad.a;
          var plr = a1 + ad.b * lrasX;
          return '短期均衡：' + xL + ' = ' + fmt(q) + '，' + yL + ' = ' + fmt(p) +
            '；与 LRAS 对照：同产出下的价格为 ' + fmt(plr) + '。拖动 AD / SRAS 制造冲击，观察产出与物价如何偏离潜在产出。';
        }
      });
      w.hint.textContent = '👆 拖动 AD（蓝）或 SRAS（青）曲线制造冲击；紫色虚线为长期总供给 LRAS';
    },

    /* slider-graph：参数化曲线/柱（滑杆驱动） */
    'slider-graph': function (host, P) {
      var w = animWidget(host);
      var mode = str(P.mode, 'line') === 'bars' ? 'bars' : 'line';
      var xRange = arr(P.xRange, [0, 10]);
      var xmin = num(xRange[0], 0), xmax = num(xRange[1], 10);
      if (!(xmax > xmin)) xmax = xmin + 10;
      var sliders = arr(P.sliders, []).filter(function (sl) { return sl && str(sl.key, ''); });
      var keys = sliders.map(function (sl) { return str(sl.key); });
      var vals = sliders.map(function (sl) { return num(sl.init, num(sl.min, 0)); });
      var expr = str(P.expr, '0');
      var fn = null;
      try { fn = new Function(['x'].concat(keys).join(','), '"use strict";return (' + expr + ');'); }
      catch (e) { fn = null; }
      function evalAt(x) {
        if (!fn) return NaN;
        try {
          var v = Number(fn.apply(null, [x].concat(vals)));
          return isFinite(v) ? v : NaN;
        } catch (e) { return NaN; }
      }
      var N = mode === 'line' ? 140 : 14;
      var W = Math.max(300, Math.min(w.svgWrap.clientWidth || 640, 700)), H = 320;
      var m = { l: 56, r: 22, t: 18, b: 48 };
      var domLo = 0, domHi = 1, sc = null, svg = null;

      function yDomain() {
        var lo = 0, hi = 1, seen = false;
        for (var i = 0; i <= N; i++) {
          var v = evalAt(xmin + (xmax - xmin) * i / N);
          if (!isNaN(v)) { if (!seen) { lo = v; hi = v; seen = true; } else { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
        }
        if (!seen) { lo = 0; hi = 1; }
        var pad = Math.max((hi - lo) * 0.1, Math.abs(hi) * 0.02, 0.5);
        return { lo: lo < 0 ? lo - pad : 0, hi: hi + pad };
      }
      function build() {
        w.svgWrap.textContent = '';
        var d = yDomain();
        domLo = d.lo; domHi = d.hi;
        svg = chartFrame(W, H, m, str(P.xLabel, 'x'), str(P.yLabel, 'y'));
        sc = svg.setDomain(xmin, xmax, domLo, domHi);
        w.svgWrap.appendChild(svg);
        redraw();
      }
      function redraw() {
        var g = s('g');
        g.setAttribute('class', 'd-series');
        if (mode === 'line') {
          var seg = '', pen = false;
          for (var i = 0; i <= N; i++) {
            var x = xmin + (xmax - xmin) * i / N, y = evalAt(x);
            if (isNaN(y)) { pen = false; continue; }
            seg += (pen ? 'L' : 'M') + sc.X(x).toFixed(1) + ',' + sc.Y(clamp(y, domLo, domHi)).toFixed(1) + ' ';
            pen = true;
          }
          if (seg.trim()) g.appendChild(s('path', { d: seg.trim(), fill: 'none', stroke: C.indigo, 'stroke-width': 3, 'stroke-linecap': 'round' }));
        } else {
          var slot = (sc.plot.x1 - sc.plot.x0) / N;
          for (var b = 0; b < N; b++) {
            var xb = xmin + (xmax - xmin) * (b + 0.5) / N, yb = evalAt(xb);
            if (isNaN(yb)) continue;
            var bx = sc.plot.x0 + slot * b + slot * 0.16, bw2 = slot * 0.68;
            var y0 = sc.Y(Math.max(domLo, 0)), y1 = sc.Y(clamp(yb, domLo, domHi));
            g.appendChild(s('rect', { x: bx, y: Math.min(y0, y1), width: bw2, height: Math.max(2, Math.abs(y0 - y1)), rx: 3, fill: C.teal, opacity: 0.92 }));
          }
        }
        var old = svg.querySelector('g.d-series');
        if (old) svg.removeChild(old);
        svg.appendChild(g);
      }
      function updateReadout() {
        var parts = sliders.map(function (sl, i) { return str(sl.label, sl.key) + ' = ' + fmt(vals[i]); });
        var mid = evalAt((xmin + xmax) / 2);
        w.readout.textContent = (parts.length ? parts.join('　｜　') + '　｜　' : '') +
          '关系式 y = ' + expr + '；x 中点处 y ≈ ' + (isNaN(mid) ? '—' : fmt(mid));
      }
      if (!fn) w.readout.textContent = '⚠️ 参数 expr 无法解析，请检查数据格式。';
      sliders.forEach(function (sl, i) {
        var lo = num(sl.min, 0), hi = num(sl.max, 10);
        if (!(hi > lo)) hi = lo + 10;
        addSlider(w, str(sl.label, sl.key), lo, hi, num(sl.step, 0.1) || 0.1, clamp(vals[i], lo, hi), function (v) {
          vals[i] = v;
          var d = yDomain();
          if (Math.abs(d.lo - domLo) > 1e-9 || Math.abs(d.hi - domHi) > 1e-9) build();
          else redraw();
          updateReadout();
        });
      });
      build();
      if (fn) updateReadout();
      w.hint.textContent = '🎚 拖动上方滑杆改变参数，曲线/柱形实时重画';
    },

    /* ppf：生产可能性边界（拖动生产点 + 滑杆使边界外移） */
    'ppf': function (host, P) {
      var w = animWidget(host);
      var goodA = str(P.goodA, '产品 A'), goodB = str(P.goodB, '产品 B');
      var maxA = num(P.maxA, 100), maxB = num(P.maxB, 100);
      var k = num(P.k, 2);
      var e = k >= 1 ? k : 2; // 契约公式为凹形（指数 2）；k ≥ 1 时作为曲率指数
      var fac = 1, B = maxB * 0.45;
      var W = Math.max(300, Math.min(w.svgWrap.clientWidth || 640, 640)), H = 340;
      var m = { l: 60, r: 24, t: 20, b: 50 };
      var svg = chartFrame(W, H, m, goodB + '（产量）', goodA + '（产量）');
      var sc = svg.setDomain(0, maxB * 1.6, 0, maxA * 1.8);
      w.svgWrap.appendChild(svg);

      function fA(b, f) {
        var mA = maxA * f, mB = maxB * f;
        return mA * (1 - Math.pow(clamp(b / mB, 0, 1), e));
      }
      function curveD(f) {
        var d = '';
        for (var i = 0; i <= 80; i++) {
          var b = maxB * f * i / 80;
          d += (i ? 'L' : 'M') + sc.X(b).toFixed(1) + ',' + sc.Y(fA(b, f)).toFixed(1) + ' ';
        }
        return d.trim();
      }
      svg.appendChild(s('path', { d: curveD(1), fill: 'none', stroke: C.muted, 'stroke-width': 1.6, 'stroke-dasharray': '5 5', opacity: 0.7 }));
      txt(svg, sc.X(maxB * 0.72), sc.Y(fA(maxB * 0.72, 1)) - 10, '初始边界', { size: 11, fill: C.muted });
      var curve = s('path', { d: curveD(fac), fill: 'none', stroke: C.teal, 'stroke-width': 3.5, 'stroke-linecap': 'round' });
      svg.appendChild(curve);
      txt(svg, sc.X(maxB * 0.2), sc.Y(fA(maxB * 0.2, 1)) - 12, '当前边界', { size: 11.5, fill: C.teal, weight: '700' });

      var dot = s('circle', { r: 8, fill: C.orange, stroke: '#fff', 'stroke-width': 2.5, class: 'd-hit' });
      var hit = s('circle', { r: 22, fill: 'rgba(0,0,0,0)', class: 'd-hit' });
      svg.appendChild(dot); svg.appendChild(hit);

      function place() {
        var a = fA(B, fac);
        if (!isFinite(B) || !isFinite(a)) return;
        dot.setAttribute('cx', sc.X(B)); dot.setAttribute('cy', sc.Y(a));
        hit.setAttribute('cx', sc.X(B)); hit.setAttribute('cy', sc.Y(a));
        var mBf = maxB * fac;
        var mc = Math.abs((maxA * fac * e / mBf) * Math.pow(clamp(B / mBf, 0, 1), e - 1));
        w.readout.textContent = '生产点：' + goodB + ' = ' + fmt(B) + '，' + goodA + ' = ' + fmt(a) +
          '　｜　该点边际机会成本 |d' + goodA + '/d' + goodB + '| ≈ ' + fmt(mc) +
          '（沿边界向右，放弃的' + goodA + '越来越多 → 机会成本递增）';
      }
      function setFromX(pt) {
        var px = (typeof pt === 'number') ? pt : (pt && pt.x);
        if (typeof px !== 'number' || !isFinite(px)) return;
        B = clamp((px - sc.plot.x0) / (sc.plot.x1 - sc.plot.x0) * (maxB * 1.6), 0, maxB * fac);
        place();
      }
      onDrag(hit, svg, { start: function () {}, move: setFromX, end: function () {} });
      onDrag(dot, svg, { start: function () {}, move: setFromX, end: function () {} });
      addSlider(w, '资源与技术（边界外移）', 0.6, 1.5, 0.05, 1, function (v) {
        fac = v;
        curve.setAttribute('d', curveD(fac));
        B = clamp(B, 0, maxB * fac);
        place();
      });
      place();
      w.hint.textContent = '👆 拖动橙色生产点沿边界移动（线内=低效、线外=不可达）；拖动滑杆使 PPF 外移/内移（经济增长）';
    },

    /* budget-optimum：预算线 + Cobb-Douglas 最优（滑杆调 px / py / m / alpha） */
    'budget-optimum': function (host, P) {
      var w = animWidget(host);
      var px = num(P.px, 2), py = num(P.py, 4), mo = num(P.m, 100);
      var alpha = clamp(num(P.alpha, 0.5), 0.2, 0.8);
      var W = Math.max(300, Math.min(w.svgWrap.clientWidth || 640, 640)), H = 340;
      var m = { l: 58, r: 22, t: 20, b: 50 };
      var svg = chartFrame(W, H, m, '商品 X（数量）', '商品 Y（数量）');
      w.svgWrap.appendChild(svg);

      function draw() {
        var xmax = (mo / Math.max(px, 0.1)) * 1.35, ymax = (mo / Math.max(py, 0.1)) * 1.35;
        svg.textContent = '';
        var sc = svg.setDomain(0, xmax, 0, ymax);
        // 预算线
        var gLine = s('g');
        gLine.appendChild(s('line', { x1: sc.X(0), y1: sc.Y(mo / Math.max(py, 0.1)), x2: sc.X(mo / Math.max(px, 0.1)), y2: sc.Y(0), stroke: C.teal, 'stroke-width': 3.2, 'stroke-linecap': 'round' }));
        txt(gLine, sc.X(mo / Math.max(px, 0.1)) - 8, sc.Y(0) - 14, '预算线 m = px·X + py·Y', { size: 12, fill: C.teal, weight: '700', anchor: 'end' });
        svg.appendChild(gLine);
        // 最优点与无差异曲线
        var xs = alpha * mo / px, ys = (1 - alpha) * mo / py;
        var U = Math.pow(xs, alpha) * Math.pow(ys, 1 - alpha);
        var gIC = s('g');
        var icd = '', started = false;
        var i0 = Math.max(xs * 0.15, 0.05), i1 = xmax * 1.05;
        for (var i = 0; i <= 90; i++) {
          var x = i0 + (i1 - i0) * i / 90;
          var y = Math.pow(U, 1 / (1 - alpha)) * Math.pow(x, -alpha / (1 - alpha));
          if (!isFinite(y) || y < 0 || y > ymax * 3) { if (started) break; continue; }
          icd += (started ? 'L' : 'M') + sc.X(x).toFixed(1) + ',' + sc.Y(y).toFixed(1) + ' ';
          started = true;
          if (y > ymax * 2.6) break;
        }
        if (icd) gIC.appendChild(s('path', { d: icd.trim(), fill: 'none', stroke: C.purple, 'stroke-width': 2.4, 'stroke-dasharray': '7 5' }));
        txt(gIC, sc.X(xs * 0.32), sc.Y(ymax * 0.86), '无差异曲线 U*', { size: 11.5, fill: C.purple, weight: '600' });
        svg.appendChild(gIC);
        var gOpt = s('g');
        gOpt.appendChild(s('circle', { cx: sc.X(xs), cy: sc.Y(ys), r: 8, fill: C.orange, stroke: '#fff', 'stroke-width': 2.5 }));
        txt(gOpt, sc.X(xs) + 12, sc.Y(ys) - 12, '最优 E*', { size: 13, fill: C.orange, weight: '700' });
        svg.appendChild(gOpt);
        w.readout.textContent = '最优消费：X* = α·m/px = ' + fmt(xs) + '，Y* = (1−α)·m/py = ' + fmt(ys) +
          '　｜　U* ≈ ' + (isFinite(U) ? fmt(U) : '—') + '　｜　切点条件 MUx/MUy = px/py = ' + fmt(px / py);
      }
      addSlider(w, '价格 px', 0.5, 10, 0.5, px, function (v) { px = v; draw(); });
      addSlider(w, '价格 py', 0.5, 10, 0.5, py, function (v) { py = v; draw(); });
      addSlider(w, '收入 m', 20, 300, 5, mo, function (v) { mo = v; draw(); });
      addSlider(w, '偏好 α（X 的支出份额）', 0.2, 0.8, 0.05, alpha, function (v) { alpha = v; draw(); });
      draw();
      w.hint.textContent = '🎚 拖动滑杆改变价格 / 收入 / 偏好：预算线转动或平移，最优切点（橙点）随之移动';
    },

    /* matrix-click：支付矩阵（点击单元格高亮 + 纳什均衡标注） */
    'matrix-click': function (host, P) {
      var w = animWidget(host);
      var p1 = str(P.p1, '参与人 A'), p2 = str(P.p2, '参与人 B');
      var p1s = arr(P.p1s, ['策略 1', '策略 2']).map(function (x) { return str(x, '策略'); });
      var p2s = arr(P.p2s, ['策略 1', '策略 2']).map(function (x) { return str(x, '策略'); });
      var pay = Array.isArray(P.payoffs) ? P.payoffs : [];
      var nash = arr(P.nash, []);
      var nR = p1s.length, nC = p2s.length;
      function payOf(r, c) {
        var cell = pay[r] && pay[r][c];
        if (Array.isArray(cell)) return [num(cell[0], 0), num(cell[1], 0)];
        return [0, 0];
      }
      var isNash = {};
      nash.forEach(function (rc) { if (Array.isArray(rc)) isNash[rc[0] + ',' + rc[1]] = true; });

      var colW = 170, rowH = 88, cornerW = 96, headH = 66;
      /* viewBox 恒取内容全宽，窄屏由 CSS max-width:100% 等比缩放，避免固定布局被裁剪 */
      var W = cornerW + colW * nC + 32;
      var H = headH + rowH * nR + 20;
      var svg = s('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', class: 'd-payoff' });
      w.svgWrap.appendChild(svg);
      var x0 = 14, y0 = 10;
      txt(svg, x0 + cornerW / 2, y0 + 16, p1 + ' ＼ ' + p2, { size: 11.5, fill: C.muted, anchor: 'middle', weight: '600' });
      for (var c = 0; c < nC; c++) {
        var cx = x0 + cornerW + c * colW;
        var lines = wrapCJK(p2s[c], 6).slice(0, 2);
        lines.forEach(function (ln, li) {
          txt(svg, cx + colW / 2, y0 + 38 - (lines.length - 1) * 9 + li * 18, ln,
            { size: 14, fill: C.indigo, anchor: 'middle', weight: '700' });
        });
      }
      var selRect = null;
      for (var r = 0; r < nR; r++) {
        var ry = y0 + headH + r * rowH;
        var rlines = wrapCJK(p1s[r], 5).slice(0, 2);
        rlines.forEach(function (ln, li) {
          txt(svg, x0 + cornerW / 2, ry + rowH / 2 + 5 - (rlines.length - 1) * 9 + li * 18, ln,
            { size: 14, fill: '#0f766e', anchor: 'middle', weight: '700' });
        });
        for (var c2 = 0; c2 < nC; c2++) {
          (function (r, c) {
            var cx = x0 + cornerW + c * colW;
            var g = s('g');
            var rect = s('rect', { x: cx + 4, y: ry + 4, width: colW - 8, height: rowH - 8, rx: 10, fill: '#fff', stroke: C.grid, 'stroke-width': 1.6 });
            g.appendChild(rect);
            var pp = payOf(r, c);
            txt(g, cx + colW / 2, ry + rowH / 2 + 6, fmt(pp[0]) + ' , ' + fmt(pp[1]), { size: 15.5, anchor: 'middle', weight: '600' });
            if (isNash[r + ',' + c]) {
              rect.setAttribute('stroke', C.purple);
              rect.setAttribute('stroke-width', 2.6);
              rect.setAttribute('stroke-dasharray', '6 4');
              txt(g, cx + colW - 20, ry + 24, '★', { size: 15, fill: C.purple, anchor: 'middle', weight: '700' });
            }
            g.style.cursor = 'pointer';
            function pick() {
              if (selRect) selRect.setAttribute('fill', '#fff');
              selRect = rect;
              rect.setAttribute('fill', C.indigoSoft);
              w.readout.textContent = '已选：' + p1 + ' 选「' + p1s[r] + '」、' + p2 + ' 选「' + p2s[c] + '」→ ' +
                p1 + ' 得 ' + fmt(pp[0]) + '，' + p2 + ' 得 ' + fmt(pp[1]) +
                (isNash[r + ',' + c] ? '　★ 纳什均衡：任何一方单独改变策略都不会更好。' : '　（★ 虚线框 = 纳什均衡）');
            }
            g.addEventListener('click', pick);
            svg.appendChild(g);
          })(r, c2);
        }
      }
      w.readout.textContent = '👆 点击任一单元格查看该策略组合下双方的收益；★ 虚线框为纳什均衡';
      w.hint.textContent = '👆 点击矩阵单元格；思考：给定对方选择，自己会不会想换策略？';
    },

    /* lorenz：洛伦兹曲线 / 基尼系数（拖动曲线上的点改变占比） */
    'lorenz': function (host, P) {
      var w = animWidget(host);
      var n = 5;
      var shares = arr(P.shares, [20, 20, 20, 20, 20]).slice(0, n).map(function (v) { return Math.max(0.1, num(v, 20)); });
      while (shares.length < n) shares.push(10);
      function normalize(list) {
        var sum = list.reduce(function (a, b) { return a + b; }, 0) || 1;
        return list.map(function (v) { return v * 100 / sum; });
      }
      shares = normalize(shares);
      var W = Math.max(300, Math.min(w.svgWrap.clientWidth || 640, 620)), H = 340;
      var m = { l: 58, r: 24, t: 20, b: 50 };
      var svg = chartFrame(W, H, m, '人口累计占比（%）', '收入累计占比（%）');
      var sc = svg.setDomain(0, 100, 0, 100);
      w.svgWrap.appendChild(svg);
      svg.appendChild(s('line', { x1: sc.X(0), y1: sc.Y(0), x2: sc.X(100), y2: sc.Y(100), stroke: C.muted, 'stroke-width': 1.8, 'stroke-dasharray': '6 5' }));
      txt(svg, sc.X(66), sc.Y(78), '绝对均等线', { size: 11.5, fill: C.muted });

      function cums() {
        var out = [0], acc = 0;
        shares.forEach(function (v) { acc += v; out.push(acc); });
        return out;
      }
      function gini() {
        var cs = cums(), area = 0;
        for (var i = 1; i <= n; i++) area += (cs[i - 1] + cs[i]) / 2 * (100 / n);
        return clamp(1 - 2 * area / 10000, 0, 1);
      }
      var shade = s('path', { fill: 'rgba(79,70,229,0.10)', stroke: 'none' });
      var curve = s('path', { fill: 'none', stroke: C.indigo, 'stroke-width': 3.4, 'stroke-linecap': 'round' });
      svg.appendChild(shade); svg.appendChild(curve);
      var dots = [];
      for (var i = 1; i < n; i++) {
        (function (k) {
          var dot = s('circle', { r: 7, fill: '#fff', stroke: C.orange, 'stroke-width': 3, class: 'd-hit' });
          var hit = s('circle', { r: 20, fill: 'rgba(0,0,0,0)', class: 'd-hit' });
          svg.appendChild(hit); svg.appendChild(dot);
          var lastY = null;
          function onStart(pt) { lastY = pt.y; }
          function onMove(pt) {
            var cs = cums();
            // 上下界：不低于前一点、不超过后一点，且永不越过绝对均等线（k/n·100）
            var lo = cs[k - 1] + 0.5;
            var hi = Math.max(lo, Math.min(cs[k + 1] - 0.5, 100 * k / n));
            var yv = clamp((sc.plot.y1 - pt.y) / (sc.plot.y1 - sc.plot.y0) * 100, lo, hi);
            var delta = yv - cs[k];
            shares[k] = clamp(shares[k] + delta, 0.5, 99);
            var others = 100 - shares[k], osum = 0, j;
            for (j = 0; j < n; j++) if (j !== k) osum += shares[j];
            if (osum <= 0) { for (j = 0; j < n; j++) if (j !== k) shares[j] = others / (n - 1); }
            else for (j = 0; j < n; j++) if (j !== k) shares[j] = Math.max(0.1, others * shares[j] / osum);
            shares = normalize(shares);
            refresh();
          }
          onDrag(dot, svg, { start: onStart, move: onMove, end: function () { lastY = null; } });
          onDrag(hit, svg, { start: onStart, move: onMove, end: function () { lastY = null; } });
          dots.push({ dot: dot, hit: hit });
        })(i);
      }
      function refresh() {
        var cs = cums();
        var d = '', diag = '', back = '';
        for (var i = 0; i <= n; i++) {
          var px = sc.X(100 * i / n), py = sc.Y(cs[i]);
          d += (i ? 'L' : 'M') + px.toFixed(1) + ',' + py.toFixed(1) + ' ';
          diag += (i ? 'L' : 'M') + px.toFixed(1) + ',' + sc.Y(100 * i / n).toFixed(1) + ' ';
        }
        for (var j = n; j >= 0; j--) back += 'L' + sc.X(100 * j / n).toFixed(1) + ',' + sc.Y(cs[j]).toFixed(1) + ' ';
        curve.setAttribute('d', d.trim());
        shade.setAttribute('d', diag + ' ' + back + ' Z');
        for (var k = 1; k < n; k++) {
          var cxk = sc.X(100 * k / n), cyk = sc.Y(cs[k]);
          dots[k - 1].dot.setAttribute('cx', cxk);
          dots[k - 1].dot.setAttribute('cy', cyk);
          dots[k - 1].hit.setAttribute('cx', cxk);
          dots[k - 1].hit.setAttribute('cy', cyk);
        }
        w.readout.textContent = '五等分收入占比：' + shares.map(function (v) { return fmt(v); }).join(' / ') +
          '　｜　基尼系数 G ≈ ' + gini().toFixed(2) + '（G 越大越不平等，曲线越弯曲）';
      }
      refresh();
      w.hint.textContent = '👆 上下拖动曲线上的 4 个橙色圆点改变各等份占比（其余等份按比例分摊），观察基尼系数变化';
    },

    /* phillips：菲利普斯曲线（滑杆调通胀预期使整条曲线移动） */
    'phillips': function (host, P) {
      var w = animWidget(host);
      var a = num(P.a, 10), b = (P.b === 0 ? -0.5 : num(P.b, -0.5));
      var expectInit = num(P.expectInit, 2);
      var eMin = num(P.expectMin, 0), eMax = Math.max(num(P.expectMax, 8), eMin + 1);
      var uMax = 12;
      var W = Math.max(300, Math.min(w.svgWrap.clientWidth || 640, 640)), H = 340;
      var m = { l: 58, r: 24, t: 20, b: 50 };
      var svg = chartFrame(W, H, m, '失业率 u（%）', '通胀率 π（%）');
      w.svgWrap.appendChild(svg);
      function pi(u, e) { return a + b * u + e; }
      var yLo = Math.min(0, pi(uMax, eMin)), yHi = Math.max(10, pi(0, eMax) * 1.08);
      var sc = svg.setDomain(0, uMax, yLo, yHi);
      function curveD(e) {
        var d = '';
        for (var i = 0; i <= 70; i++) {
          var u = uMax * i / 70;
          d += (i ? 'L' : 'M') + sc.X(u).toFixed(1) + ',' + sc.Y(pi(u, e)).toFixed(1) + ' ';
        }
        return d.trim();
      }
      svg.appendChild(s('path', { d: curveD(expectInit), fill: 'none', stroke: C.muted, 'stroke-width': 1.6, 'stroke-dasharray': '5 5', opacity: 0.75 }));
      txt(svg, sc.X(uMax * 0.98), sc.Y(pi(uMax, expectInit)) - 8, '初始预期 Eπ = ' + fmt(expectInit) + '%', { size: 11, fill: C.muted, anchor: 'end' });
      var curve = s('path', { d: curveD(expectInit), fill: 'none', stroke: C.red, 'stroke-width': 3.2, 'stroke-linecap': 'round' });
      svg.appendChild(curve);
      if (b < 0) {
        var un = a / (-b);
        if (un > 0.3 && un < uMax) {
          svg.appendChild(s('line', { x1: sc.X(un), y1: sc.plot.y0, x2: sc.X(un), y2: sc.plot.y1, stroke: C.purple, 'stroke-width': 1.8, 'stroke-dasharray': '4 4' }));
          txt(svg, sc.X(un) + 5, sc.plot.y0 + 14, '自然失业率 uₙ', { size: 11, fill: C.purple, weight: '600' });
        }
      }
      var expect = expectInit;
      addSlider(w, '通胀预期 Eπ（%）', eMin, eMax, 0.5, expectInit, function (v) {
        expect = v;
        curve.setAttribute('d', curveD(expect));
        update();
      });
      function update() {
        var un2 = b < 0 ? a / (-b) : null;
        w.readout.textContent = '当前预期 Eπ = ' + fmt(expect) + '%：π = ' + fmt(a) + (b < 0 ? ' − ' : ' + ') +
          fmt(Math.abs(b)) + '·u + Eπ 整体' + (expect > expectInit ? '上移' : (expect < expectInit ? '下移' : '保持不动')) +
          (un2 && un2 > 0 && un2 < uMax ? '；π = Eπ 处 u = uₙ ≈ ' + fmt(un2) + '%（长期权衡消失）' : '。预期越高，同一失业率对应的通胀越高。');
      }
      update();
      w.hint.textContent = '🎚 拖动「通胀预期」滑杆：预期升高 → 整条曲线上移（短期权衡恶化，可能走向滞胀）';
    }
  };

  /* ============================================================
     三、对外 API + 容错 + 自适应重渲染
     ============================================================ */
  var registry = [];

  function safeRender(containerEl, spec, kind, table) {
    if (!containerEl || containerEl.nodeType !== 1) return;
    try {
      var type = spec && str(spec.type, '');
      var fn = table[type];
      if (!fn) throw new Error('未知类型：' + (type || '(空)'));
      var host = h('div', kind === 'image' ? 'fig-inner' : '');
      containerEl.appendChild(host);
      fn(host, (spec && spec.params) || {});
      registry.push({ el: containerEl, spec: spec, kind: kind });
    } catch (err) {
      if (window.console && console.warn) console.warn('[diagrams] 渲染失败：', kind, spec && spec.type, err);
      var box = h('div', 'frontier-empty');
      box.textContent = '（示意图加载失败：' + ((spec && spec.type) || '未知类型') + '）' +
        (spec && spec.caption ? ' ' + spec.caption : '');
      containerEl.appendChild(box);
    }
  }

  window.Diagrams = {
    renderImage: function (containerEl, imageSpec) { safeRender(containerEl, imageSpec, 'image', images); },
    renderAnimation: function (containerEl, animSpec) { safeRender(containerEl, animSpec, 'anim', animations); }
  };

  /* 视口明显变宽/变窄时整体重渲染（移动端滚动引起的微小变化不触发） */
  var lastW = (typeof window !== 'undefined') ? window.innerWidth : 0, timer = null;
  window.addEventListener('resize', function () {
    if (Math.abs(window.innerWidth - lastW) < 40) return;
    lastW = window.innerWidth;
    clearTimeout(timer);
    timer = setTimeout(function () {
      var jobs = registry.filter(function (r) { return r.el && r.el.isConnected; });
      registry.length = 0;
      jobs.forEach(function (r) {
        try { r.el.textContent = ''; } catch (e) { /* ignore */ }
        safeRender(r.el, r.spec, r.kind, r.kind === 'image' ? images : animations);
      });
    }, 250);
  });
})();
