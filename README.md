# 经济学自学站 · 交互式经济学学习网站

面向零基础学习者的交互式经济学学习网站：从大学基础课水平逐层进阶到考研与中高级水平。覆盖**微观经济学 10 章 + 宏观经济学 9 章 + 当代前沿专题 1 章，共 20 章 / 106 个知识点 / 318 道分层例题**。

**纯静态站点**：仅 HTML + CSS + 原生 JavaScript，零构建、零外部依赖（无 CDN / 字体 / 框架），可直接托管在 GitHub Pages。

## 快速开始

### 本地预览

```bash
git clone https://github.com/<你的用户名>/<仓库名>.git
cd <仓库名>
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

> 必须通过 HTTP 服务访问（页面通过 fetch 加载章节 JSON 数据），直接双击 HTML 文件无法加载数据。

### 部署到 GitHub Pages（完整步骤）

1. **创建 GitHub 仓库**：在 GitHub 上新建一个公开仓库（例如 `economics-learning`），**不要**初始化 README。
2. **推送代码**：
   ```bash
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git branch -M main
   git push -u origin main
   ```
3. **开启 Pages**：仓库页面 → **Settings** → 左侧 **Pages** → **Build and deployment** 下 **Source** 选择 **Deploy from a branch** → Branch 选 **main**、目录选 **/(root)** → **Save**。
4. **等待 1~2 分钟**，访问 `https://<你的用户名>.github.io/<仓库名>/` 即可。

命令行方式（已安装并登录 `gh` CLI 时）：

```bash
gh repo create <仓库名> --public --source=. --push
gh api -X POST repos/<你的用户名>/<仓库名>/pages -f "source[branch]=main" -f "source[path]=/"
```

> 仓库已包含 `.nojekyll`（跳过 Jekyll 处理，保证 `_plan.json` 等数据文件可直接访问）。

## 网站结构

| 部分 | 说明 |
|---|---|
| `index.html` | 学习地图：可折叠思维导图（板块 → 章 → 知识点）、按章分组的学习网格（未学/学习中/已完成/做错·待复习）、总进度、错题本 |
| `about.html` | 学习方法：费曼技巧、间隔重复、主动回忆在本站的用法；如何阅读真实案例与前沿研究 |
| `m01-01.html … x01-05.html` | 106 个知识点页，每页固定 10 个模块 |
| `assets/data/*.json` | 全部教学内容（唯一事实源），页面运行时加载渲染 |
| `assets/` | 共享渲染器与样式（style.css / page.js / diagrams.js / quiz.js / nav.js / mindmap.js） |

### 知识点页的 10 个模块

导航条（上一讲/思维导图/下一讲 + 章进度）→ 🌱 L1 基础层（一句话定义 + 生活类比 + SVG 示意图）→ 📖 真实案例（联网核验的经济事件/政策）→ 🎬 交互动画（SVG + 原生 JS，可拖拽/点击）→ 🌲 L2 进阶层（图形推导 + 考点 + 常见误区）→ ⭐ L3 高阶视角（可折叠数学表述）→ ✍️ 例题区（3 道分层例题即时判题、答错进错题本）→ 🔗 联系网络（它从哪来/通向哪里）→ 🔬 前沿进展（近年研究，可折叠，标注争议）→ 🔊 朗读按钮 + 本页参考来源。

### 学习进度说明

进度、错题本全部存储在浏览器 `localStorage` 中（不上传任何服务器）：答对全部 3 道例题即完成该知识点；答错的题进入错题本，7 天内学习地图会标记「做错·待复习」。

## 内容与引用

- 教学内容以曼昆《经济学原理》《宏观经济学》、高鸿业《西方经济学》、范里安《微观经济学：现代观点》的共识知识为基准。
- 「真实案例」与「前沿进展」均来自公开可核验的联网来源（NBER、AER/QJE/JPE 等期刊页、IMF/世界银行/BIS/OECD、各国央行与统计局等），每页底部附「本页参考来源」；有争议的结论明确标注「学界尚有争议」。
- 检索不到可靠来源的前沿内容，页面如实标注「本节暂未纳入近年研究」。

## 开发

- `tools/gen_page.py`：从 `assets/data/_plan.json` 生成知识点页静态壳（`python3 tools/gen_page.py m01` 或无参数生成全部）。
- `tools/validate.py`：校验章节数据契约（`python3 tools/validate.py m01 m02 …`）。
- 修改内容只需编辑 `assets/data/{章id}.json`，页面无需重建。
