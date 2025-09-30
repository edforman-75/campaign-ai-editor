#!/usr/bin/env python3
import argparse, xml.etree.ElementTree as ET

def color_for_ratio(pct):
    if pct >= 0.95: return "#2e7d32"   # green
    if pct >= 0.85: return "#f9a825"   # yellow
    return "#c62828"                   # red

def make_badge(label, text, color):
    # Simple shields-like flat badge SVG (no external deps)
    # Widths are rough; for CI status it's fine.
    font_w = 7
    pad = 10
    label_w = max(60, len(label)*font_w + pad)
    text_w = max(70, len(text)*font_w + pad)
    total = label_w + text_w
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{total}" height="20" role="img" aria-label="{label}: {text}">
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <mask id="m"><rect width="{total}" height="20" rx="3" fill="#fff"/></mask>
  <g mask="url(#m)">
    <rect width="{label_w}" height="20" fill="#555"/>
    <rect x="{label_w}" width="{text_w}" height="20" fill="{color}"/>
    <rect width="{total}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="{label_w/2}" y="14">{label}</text>
    <text x="{label_w + text_w/2}" y="14">{text}</text>
  </g>
</svg>'''

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--junit", required=True, help="Path to pytest JUnit XML")
    ap.add_argument("--out", required=True, help="Output SVG path")
    ap.add_argument("--label", default="adversarial")
    args = ap.parse_args()
    tree = ET.parse(args.junit); root = tree.getroot()
    # Handle both <testsuite> root and <testsuites> wrapper
    if root.tag == 'testsuites':
        testsuite = root.find('.//testsuite')
        if testsuite is not None:
            root = testsuite
    total = int(root.attrib.get("tests", 0) or 0)
    failures = int(root.attrib.get("failures", 0) or 0)
    errors = int(root.attrib.get("errors", 0) or 0)
    skipped = int(root.attrib.get("skipped", 0) or 0)
    passed = total - failures - errors - skipped
    ratio = (passed/total) if total else 0.0
    color = color_for_ratio(ratio)
    text = f"{passed}/{total}"
    svg = make_badge(args.label, text, color)
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"Badge: {text} ({ratio:.1%}) -> {args.out}")

if __name__ == "__main__":
    main()
