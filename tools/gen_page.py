#!/usr/bin/env python3
"""页面生成器：读 assets/data/_plan.json，为指定章生成 {章id}-{序号}.html 静态壳到仓库根目录。

用法：
    python3 tools/gen_page.py m01           # 只生成 m01
    python3 tools/gen_page.py m01 m02       # 多章
    python3 tools/gen_page.py               # 全部章

壳只是渲染器：页面内容全部由 assets/page.js 从 JSON 读取渲染（事实源唯一）。
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN_PATH = ROOT / 'assets' / 'data' / '_plan.json'

SHELL = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title_attr}</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="assets/style.css">
</head>
<body data-chapter="{chapter_id}" data-point="{point_id}">
<div id="app">加载中…</div>
<script src="assets/diagrams.js"></script>
<script src="assets/quiz.js"></script>
<script src="assets/nav.js"></script>
<script src="assets/page.js"></script>
</body>
</html>
"""


def main() -> int:
    plan = json.loads(PLAN_PATH.read_text(encoding='utf-8'))
    chapters = plan.get('chapters', [])
    targets = sys.argv[1:]
    if not targets:
        targets = [c['id'] for c in chapters]

    generated = 0
    for cid in targets:
        chapter = next((c for c in chapters if c['id'] == cid), None)
        if chapter is None:
            print(f'错误：_plan.json 中没有章 {cid}', file=sys.stderr)
            return 1
        for point in chapter.get('points', []):
            pid = point['id']
            title_attr = html_escape(f"{cid} {point['title']} · {chapter['title']} | 经济学自学站")
            out = ROOT / f'{pid}.html'
            out.write_text(
                SHELL.format(title_attr=title_attr, chapter_id=cid, point_id=pid),
                encoding='utf-8')
            generated += 1
            print(f'生成 {out.relative_to(ROOT)}')
    print(f'完成：共 {generated} 页')
    return 0


def html_escape(s: str) -> str:
    return (s.replace('&', '&amp;').replace('<', '&lt;')
             .replace('>', '&gt;').replace('"', '&quot;'))


if __name__ == '__main__':
    sys.exit(main())
