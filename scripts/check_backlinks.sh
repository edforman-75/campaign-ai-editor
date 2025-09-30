#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Pages to scan for a "Back to Portal Home" link back to cpo_docs/index.html
SCAN_DIRS=(
  "cpo_docs"
  "cpo_templates"
  "cpo_examples"
)

# Exemptions: portal home itself
EXEMPT_HTML=(
  "cpo_docs/index.html"
)

# Acceptable backlink targets (relative paths commonly used)
HTML_OK_PTRNS=(
  'href="index.html"'
  "href='index.html'"
  'href="../cpo_docs/index.html"'
  "href='../cpo_docs/index.html'"
  'href="/cpo_docs/index.html"'
  "href='/cpo_docs/index.html'"
)

MD_OK_PTRNS=(
  "](index.html)"
  "](../cpo_docs/index.html)"
  "](/cpo_docs/index.html)"
)

err=0

is_exempt() {
  local f="$1"
  for e in "${EXEMPT_HTML[@]}"; do
    [[ "$f" == "$e" ]] && return 0
  done
  return 1
}

has_ok_pattern() {
  local f="$1"
  shift
  for p in "$@"; do
    if grep -q "$p" "$f"; then
      return 0
    fi
  done
  return 1
}

# Collect files
mapfile -t files < <( \
  find "${SCAN_DIRS[@]}" -type f \( -name "*.html" -o -name "*.md" \) \
  -not -path "*/node_modules/*" -not -path "*/.git/*" | LC_ALL=C sort )

missing=()

for f in "${files[@]}"; do
  rel="${f#"$ROOT/"}"
  case "$rel" in
    *.html)
      if is_exempt "$rel"; then
        continue
      fi
      if ! has_ok_pattern "$rel" "${HTML_OK_PTRNS[@]}"; then
        missing+=("$rel")
      fi
      ;;
    *.md)
      if ! has_ok_pattern "$rel" "${MD_OK_PTRNS[@]}"; then
        missing+=("$rel")
      fi
      ;;
  esac
done

if ((${#missing[@]})); then
  printf "\n❌ Missing 'Back to Portal Home' link in the following files:\n"
  for m in "${missing[@]}"; do
    echo " - $m"
  done
  printf "\nExpected a link to one of:\n"
  printf "  HTML: %s\n" "${HTML_OK_PTRNS[@]}"
  printf "   MD: %s\n" "${MD_OK_PTRNS[@]}"
  echo
  exit 1
fi

echo "✅ All pages include a link back to the portal home."