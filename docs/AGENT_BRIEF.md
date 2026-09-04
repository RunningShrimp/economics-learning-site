# AGENT_BRIEF — 全站共享契约（所有子 Agent 必读）

项目：经济学交互学习网站（GitHub Pages 纯静态站点）
项目根目录：`/Users/didi/Desktop/project/knowledge/Economics_knowledge`
读者定位：经济学零基础学习者，从大学基础课进阶到考研与中高级水平。

## 1. 硬性约束（违反即返工）
1. 技术栈仅 HTML + CSS + 原生 JavaScript；**禁止任何外部资源加载**（CDN、外部字体、图片、框架、MathJax）。引用来源只以 `<a>` 链接文字呈现。
2. 数学一律用纯文本/Unicode 记号（如 `MU_x / P_x = MU_y / P_y`、`∂U/∂x`、`Y = A·K^α·L^(1-α)`），不用 LaTeX 语法。
3. 全站内容为简体中文，术语首次出现附英文（如「边际效用（marginal utility）」）。
4. 事实源唯一：页面内容全部来自 `assets/data/{章id}.json`，页面壳只是渲染器。

## 2. 内容真实性协议（最高优先级）
1. **双源制**：L1/L2/L3 教学内容以教材共识为基准（曼昆《经济学原理》、高鸿业《西方经济学》、范里安《微观经济学：现代观点》、曼昆《宏观经济学》），无需联网；「真实案例」与「前沿进展」**必须来自实际联网检索**。
2. **三步引用流程**：检索（WebSearch）→ 打开来源页面阅读核实（WebFetch）→ 按格式引用。**只允许引用实际打开并核实过的来源。**
3. **严禁凭记忆引用**文献、数据、百分比、金额、时间。记不清、查不到、打不开的来源一律不写；宁可标注缺失，不得编造或"合理改写"。
4. **统一引用格式**：`[作者或机构, 年份, 《来源名》, 标题](URL)`。例：`[U.S. BLS, 2024, 《TED: The Economics Daily》, Median usual weekly earnings](https://www.bls.gov/opub/ted/xxx)`。
5. 数据表述必须与来源原文一致；有争议结论须标注「学界尚有争议」并呈现对立观点。
6. 检索不到可靠近年研究时，frontier 数组写 `[{ "finding": "本节暂未纳入近年研究（未检索到可核验的可靠来源）", "controversy": "", "citation": "" }]`——这是唯一合法的空态写法。
7. 优先可公开访问的来源：NBER 工作论文页、期刊官方摘要页（AER/QJE/Econometrica/Nature/Science/PNAS）、IMF/WB/OECD/BIS/ILO 报告页、央行与统计局官网、Our World in Data、权威媒体财经报道（Reuters/FT/Bloomberg/财新/澎湃）。付费墙打不开就换源。

## 3. 目录结构
```
index.html / about.html            ← 门户（Phase 3）
{章id}-{序号}.html                 ← 知识点页，平铺根目录（如 m02-03.html）
assets/style.css                   ← 全站样式
assets/page.js                     ← 知识点页渲染器（10 模块）
assets/diagrams.js                 ← 示意图 + 交互动画目录（8 类）
assets/quiz.js                     ← 判题 + 错题本
assets/nav.js                      ← 进度跟踪 + 上一讲/下一讲 + 章进度条
assets/mindmap.js                  ← index 思维导图 + 学习地图 + 总进度 + 错题本
assets/data/_plan.json             ← 全站章节/知识点清单（全局顺序权威，勿改结构）
assets/data/{章id}.json            ← 各章内容（唯一内容事实源）
```

## 4. 章节数据 JSON 契约（Knowledge Agent 产出）
文件：`assets/data/{章id}.json`，UTF-8。顶层：`{ "chapter", "title", "points": [...] }`。
`points[].id`、顺序必须与 `assets/data/_plan.json` 中该章一致。每个 point 字段如下（**全部必填、非空字符串**，除标注可空者）：

```json
{
  "id": "m02-03",
  "title": "市场均衡与价格机制",
  "l1": {
    "definition": "一句话定义（零基础能懂）",
    "analogy": "1~2 个日常生活类比，先类比后术语",
    "image": { "type": "two-lines-intersection", "params": {}, "caption": "图注（一句话）" }
  },
  "case": {
    "event": "真实经济事件/政策名称",
    "facts": "时间 + 主体 + 关键数据（数字必须与来源原文一致）",
    "source_ref": "[作者或机构, 年份, 《来源名》, 标题](URL) —— 必须与 references 中某条完全一致",
    "explain": "用本知识点解释该现实（2~4 句）"
  },
  "l2": {
    "derivation": "图形推导或计算演示（考研深度，可用换行与编号步骤）",
    "exam_tips": "考点提示",
    "pitfalls": ["❌误区 → ✅纠正", "❌… → ✅…"]
  },
  "l3": { "math": "中高级数学表述（可折叠显示）：约束优化/代数推导/模型结论" },
  "animation": { "type": "<目录中的类型>", "params": {}, "description": "一句话说明演示什么", "interactions": ["可做的操作说明"] },
  "quiz": [
    { "level": "L1", "stem": "概念题干", "options": ["A", "B", "C", "D"], "answer": 1, "explain": "解析", "hint": "答错时的针对性提示" },
    { "level": "L2", "stem": "计算/图形题干（至少 1 题以本页真实案例为背景）", "options": ["…"], "answer": 0, "explain": "…", "hint": "…" },
    { "level": "L3", "stem": "考研难度题干", "options": ["…"], "answer": 2, "explain": "…", "hint": "…" }
  ],
  "frontier": [
    { "finding": "研究问题+核心发现+对教材结论的补充/修正", "controversy": "争议点或空串；有争议时写明对立观点", "citation": "[作者, 年份, 《来源》, 标题](URL)" }
  ],
  "links": {
    "prev": ["m02-02|一句话说明它从哪来"],
    "next": ["m03-01|一句话说明它通向哪里"]
  },
  "references": [ "[作者或机构, 年份, 《来源名》, 标题](URL)", "…" ]
}
```

规则：
- `quiz` 恰好 3 项，level 依次 L1/L2/L3；`options` 恰 4 项；`answer` 为正确项的 0-based 下标；正确项位置要分散；每项必有 `explain` 与 `hint`；**至少 1 题（通常 L2）以本页 case 为题干背景**。
- `frontier` 1~3 项（或合法空态）；其中 citation 必须同时出现在 `references`。
- `links`：prev/next 各 1~3 项，格式 `"知识点id|一句话联系"`；id 必须存在于 `_plan.json`（可跨章，通常取全局顺序的前/后知识点，也可指向更相关的知识点）。
- `references`：本页全部引用清单，格式统一；案例引用 + 前沿引用都必须在列。
- `pitfalls` 至少 1 条，统一 `❌… → ✅…` 格式。

## 5. 示意图目录（l1.image.type，由 diagrams.js 渲染）
| type | params | 用途 |
|---|---|---|
| `two-lines-intersection` | `{ "aLabel": "需求 D", "aDir": "down", "bLabel": "供给 S", "bDir": "up", "xLabel": "数量 Q", "yLabel": "价格 P", "pointLabel": "均衡 E" }` | 两条线+交点（aDir: down/up 表示下降/上升曲线） |
| `flow-loop` | `{ "nodes": ["家庭", "商品市场", "企业", "要素市场"], "xLabel": "", "yLabel": "" }` | 循环流量/闭环流程 |
| `bars` | `{ "items": [{"label": "A", "value": 3}, …], "xLabel": "", "yLabel": "" }` | 柱状对比 |
| `matrix` | `{ "rowLabels": ["…"], "colLabels": ["…"], "cells": [["…","…"],["…","…"]] }` | 2×2 结构/收益矩阵 |

## 6. 交互动画目录（animation.type，由 diagrams.js 渲染；必须可点击/拖拽）
| type | params 示例 | 适用 |
|---|---|---|
| `sd-shift` | `{ "demand": {"a": 100, "b": -2}, "supply": {"a": 20, "b": 2}, "draggable": "demand", "xLabel": "Q", "yLabel": "P" }`（线性 P=a+bQ；draggable 曲线可用鼠标上下拖动截距） | 供求均衡与移动 |
| `slider-graph` | `{ "mode": "line"|"bars", "expr": "100 - 2*x", "xRange": [0, 50], "yLabel": "P", "xLabel": "Q", "sliders": [{"key": "s1", "min": 0, "max": 10, "step": 0.1, "init": 5, "label": "价格P"}] }`；`expr` 是 JS 表达式，可用变量 `x` 与各 slider key | 弹性/成本/乘数等一切参数化曲线 |
| `ppf` | `{ "goodA": "农产品", "goodB": "工业品", "maxA": 100, "maxB": 100, "k": 0.5 }`（凹形 PPF：A = maxA·(1-(B/maxB)^2)；拖动生产点，滑杆外移 PPF） | PPF 与机会成本 |
| `budget-optimum` | `{ "px": 2, "py": 4, "m": 100, "alpha": 0.5 }`（Cobb-Douglas U = x^alpha·y^(1-alpha)）；滑杆调 px/py/m | 消费者最优 |
| `matrix-click` | `{ "p1": "囚徒A", "p2": "囚徒B", "p1s": ["坦白","抵赖"], "p2s": ["坦白","抵赖"], "payoffs": [[[-8,-8],[0,-10]],[[-10,0],[-1,-1]]], "nash": [[0,0]] }`；点击单元格高亮 + 标注纳什均衡 | 博弈/支付矩阵 |
| `lorenz` | `{ "shares": [5, 10, 15, 20, 50] }`（五等分收入占比，可拖动） | 洛伦兹曲线/基尼 |
| `ad-as` | `{ "ad": {"a": 100, "b": -2}, "sras": {"a": 20, "b": 2}, "lrasX": 40 }`；拖动 AD/SRAS 曲线 | AD-AS 模型 |
| `phillips` | `{ "a": 10, "b": -0.5, "expectInit": 2, "expectMin": 0, "expectMax": 8 }`（π = a + b·u + expect；滑杆调通胀预期使曲线移动） | 菲利普斯曲线 |

## 7. 页面 10 模块顺序（page.js 渲染，缺一不可）
① 导航条（上一讲/思维导图(index.html)/下一讲 + 本章进度条）→ ② 🌱L1（定义→类比→示意图）→ ③ 📖真实案例 → ④ 🎬交互动画 → ⑤ 🌲L2（推导+考点+误区）→ ⑥ ⭐L3（`<details>` 折叠数学）→ ⑦ ✍️例题区（3 题锁步判题）→ ⑧ 🔗联系网络（它从哪来/通向哪里）→ ⑨ 🔬前沿进展（`<details>` 折叠）→ ⑩ 🔊朗读按钮（SpeechSynthesis 读 L1）+ 页脚「本页参考来源」。

## 8. 学习科学与判题契约（quiz.js/nav.js）
- 判题：答对→展示解析并解锁下一题；答错→针对性 hint 后可重做，并写入 `localStorage` 错题本。
- localStorage 键（Builder/QA 共同遵守）：`econ.progress` = `{pointId: {done: true|false, wrong: true|false, at: ts}}`；`econ.errors` = `{pointId: {qIndex: {count, lastWrongAt}}}`。
- 学习地图状态：`done&&!wrong` → 已完成；`errors 有记录且 7 天内 lastWrongAt` → 做错·待复习；其余 → 未学/学习中。
- 朗读：`speechSynthesis`，lang `zh-CN`，朗读 l1.definition + l1.analogy，可停止。

## 9. 自检命令（Knowledge/Builder Agent 交付前必须执行）
```bash
python3 - <<'EOF'
import json
d = json.load(open('assets/data/CHAPTER.json'))
plan = {p['id'] for c in json.load(open('assets/data/_plan.json'))['chapters'] if c['id']=='CHAPTER' for p in c['points']}
assert [p['id'] for p in d['points']] == sorted(plan, key=lambda i: [x['id'] for x in next(c for c in json.load(open('assets/data/_plan.json'))['chapters'] if c['id']=='CHAPTER')['points']].index(i)), 'id 顺序不符'
for p in d['points']:
    for k in ['id','title','l1','case','l2','l3','animation','quiz','links','references']:
        assert p.get(k), (p['id'], k)
    assert len(p['quiz']) == 3 and all(len(q['options']) == 4 and 0 <= q['answer'] < 4 and q.get('explain') and q.get('hint') for q in p['quiz'])
    assert [q['level'] for q in p['quiz']] == ['L1','L2','L3']
    for f in p['frontier']:
        assert f.get('finding')
        if f['finding'].startswith('本节暂未纳入') is False:
            assert f.get('citation','').startswith('[') and '](http' in f.get('citation',''), (p['id'], 'citation 格式')
print('OK: %d points' % len(d['points']))
EOF
```
（把 `CHAPTER.json` 换成对应章 id 再执行；通过后才能交付。）
