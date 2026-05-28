#!/usr/bin/env python3
"""
项目指标统计脚本 (Sprint 2 完整版)
支持: 代码行数、文件数、圈复杂度(Cyclomatic Complexity)、依赖数
用法: python scripts/project_stats.py
"""
import os
import json
import re
from pathlib import Path
from collections import defaultdict
from datetime import datetime

PROJECT_ROOT = Path(".")
SRC_DIR = PROJECT_ROOT / "src"

INCLUDE_EXTS = {'.ts', '.vue', '.js', '.css', '.html'}
EXCLUDE_DIRS = {'node_modules', 'dist', '.git', '.vscode', 'coverage', 'public', 'scripts'}

def should_include(path: Path) -> bool:
    if path.suffix not in INCLUDE_EXTS:
        return False
    for part in path.parts:
        if part in EXCLUDE_DIRS:
            return False
    return True

def analyze_file(path: Path) -> dict:
    try:
        content = path.read_text(encoding='utf-8')
    except Exception:
        return None
    lines = content.splitlines()
    total = len(lines)
    blank = sum(1 for l in lines if l.strip() == '')
    comment = 0
    code_lines = []

    if path.suffix in ('.ts', '.js', '.vue', '.css'):
        in_multiline = False
        for line in lines:
            stripped = line.strip()
            if path.suffix == '.vue' and stripped.startswith('<!--'):
                in_multiline = True
            if in_multiline:
                comment += 1
                if '-->' in stripped:
                    in_multiline = False
                continue
            if stripped.startswith('//') or stripped.startswith('#'):
                comment += 1
            elif '/*' in stripped and '*/' not in stripped:
                in_multiline = True
                comment += 1
            elif '/*' in stripped and '*/' in stripped:
                comment += 1
            else:
                if stripped and not stripped.startswith('//'):
                    code_lines.append(stripped)

    code = max(total - blank - comment, 0)

    # 简单圈复杂度估算: 统计决策点
    # 决策点: if, else, for, while, switch, case, catch, &&, ||, ?:, try
    text = content
    # Vue 文件只统计 <script> 部分
    if path.suffix == '.vue':
        script_match = re.search(r'<script[^>]*>(.*?)</script>', text, re.DOTALL)
        if script_match:
            text = script_match.group(1)

    decisions = (
        len(re.findall(r'\bif\b', text)) +
        len(re.findall(r'\belse\b', text)) +
        len(re.findall(r'\bfor\b', text)) +
        len(re.findall(r'\bwhile\b', text)) +
        len(re.findall(r'\bswitch\b', text)) +
        len(re.findall(r'\bcase\b', text)) +
        len(re.findall(r'\bcatch\b', text)) +
        len(re.findall(r'\btry\b', text)) +
        len(re.findall(r'&&|\|\|', text)) +
        len(re.findall(r'\?\s*[^:]*\s*:', text))
    )
    # 圈复杂度 = 决策点 + 1
    cyclomatic = max(decisions + 1, 1)

    return {
        'path': str(path),
        'ext': path.suffix,
        'total': total,
        'code': code,
        'comment': comment,
        'blank': blank,
        'cyclomatic': cyclomatic,
        'decision_points': decisions
    }

def count_functions_and_complexity():
    stats = {
        'vue_components': 0,
        'ts_api_files': 0,
        'views': 0,
        'stores': 0,
        'router_files': 0,
        'supabase_tables': 7
    }
    if (SRC_DIR / "views").exists():
        stats['views'] = len(list((SRC_DIR / "views").glob("*.vue")))
    if (SRC_DIR / "api").exists():
        stats['ts_api_files'] = len(list((SRC_DIR / "api").glob("*.ts")))
    if (SRC_DIR / "components").exists():
        stats['vue_components'] = len(list((SRC_DIR / "components").glob("*.vue")))
    if (SRC_DIR / "stores").exists():
        stats['stores'] = len(list((SRC_DIR / "stores").glob("*.ts")))
    if (SRC_DIR / "router").exists():
        stats['router_files'] = len(list((SRC_DIR / "router").glob("*.ts")))
    return stats

def main():
    print("🔍 正在扫描项目...")
    files = [p for p in PROJECT_ROOT.rglob("*") if p.is_file() and should_include(p)]

    by_ext = defaultdict(list)
    results = []
    total_stats = {'total': 0, 'code': 0, 'comment': 0, 'blank': 0, 'cyclomatic': 0}

    for f in files:
        r = analyze_file(f)
        if r:
            results.append(r)
            by_ext[r['ext']].append(r)
            for k in total_stats:
                total_stats[k] += r[k]

    struct = count_functions_and_complexity()

    deps_count = 0
    dev_deps_count = 0
    pkg = PROJECT_ROOT / "package.json"
    if pkg.exists():
        data = json.loads(pkg.read_text())
        deps_count = len(data.get('dependencies', {}))
        dev_deps_count = len(data.get('devDependencies', {}))

    # 计算平均圈复杂度
    avg_cyclomatic = round(total_stats['cyclomatic'] / len(results), 2) if results else 0
    max_cyclomatic = max((r['cyclomatic'] for r in results), default=0)
    max_file = next((r['path'] for r in results if r['cyclomatic'] == max_cyclomatic), "N/A")

    print("\n" + "="*65)
    print("📊 校园社交市场 — 项目指标统计报告 (Sprint 2)")
    print("="*65)
    print(f"统计时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"\n📁 基础指标:")
    print(f"   总文件数:      {len(files)}")
    print(f"   总代码行:      {total_stats['total']:,}")
    print(f"   纯代码行:      {total_stats['code']:,}")
    print(f"   注释行:        {total_stats['comment']:,}")
    print(f"   空行:          {total_stats['blank']:,}")

    print(f"\n📈 复杂度指标:")
    print(f"   总圈复杂度:    {total_stats['cyclomatic']:,}")
    print(f"   平均圈复杂度:  {avg_cyclomatic}")
    print(f"   最高圈复杂度:  {max_cyclomatic} (文件: {max_file})")

    print(f"\n📂 按语言分布:")
    for ext, items in sorted(by_ext.items(), key=lambda x: -sum(i['code'] for i in x[1])):
        code_lines = sum(i['code'] for i in items)
        cyclomatic = sum(i['cyclomatic'] for i in items)
        print(f"   {ext:6} | {len(items):3} 文件 | {code_lines:,} 行代码 | 圈复杂度: {cyclomatic}")

    print(f"\n🏗️ 架构指标:")
    for k, v in struct.items():
        print(f"   {k:20}: {v}")

    print(f"\n📦 依赖统计:")
    print(f"   生产依赖: {deps_count}")
    print(f"   开发依赖: {dev_deps_count}")
    print(f"   总计:     {deps_count + dev_deps_count}")

    report = {
        'generated_at': datetime.now().isoformat(),
        'summary': {
            'total_files': len(files),
            'total_lines': total_stats['total'],
            'code_lines': total_stats['code'],
            'comment_lines': total_stats['comment'],
            'blank_lines': total_stats['blank'],
            'total_cyclomatic': total_stats['cyclomatic'],
            'avg_cyclomatic': avg_cyclomatic,
            'max_cyclomatic': max_cyclomatic,
            'max_cyclomatic_file': max_file
        },
        'by_extension': {
            ext: {
                'files': len(items),
                'code_lines': sum(i['code'] for i in items),
                'cyclomatic': sum(i['cyclomatic'] for i in items)
            } for ext, items in by_ext.items()
        },
        'architecture': struct,
        'dependencies': {
            'production': deps_count,
            'development': dev_deps_count,
            'total': deps_count + dev_deps_count
        }
    }

    out_path = PROJECT_ROOT / "scripts" / "project-stats.json"
    out_path.parent.mkdir(exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"\n✅ 详细 JSON 报告已保存: {out_path}")
    print("   请将此 JSON 数据填入 README.md 和 final-report-teamID.md")

if __name__ == "__main__":
    main()
