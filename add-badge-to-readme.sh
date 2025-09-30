#!/bin/bash
# Script to add adversarial badge to README.md
# Handles zsh history expansion by using single quotes around markdown

REPO_PATH="$(
  git config --get remote.origin.url | sed -E 's#(git@|https://)github\.com[:/](.+)(\.git)?#\2#'
)"
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"

BADGE_URL="https://raw.githubusercontent.com/${REPO_PATH}/${DEFAULT_BRANCH}/badges/adversarial_badge.svg"

# Use single quotes around the parts with "!" and splice in the URL
# This avoids zsh history expansion: zsh: event not found: [Adversarial](
BADGE_MD='![Adversarial]('"$BADGE_URL"')'

mkdir -p badges
[ -f README.md ] || printf "# %s\n\n" "${REPO_PATH##*/}" > README.md

if ! grep -q 'adversarial_badge\.svg' README.md; then
  if grep -nE '^# ' README.md >/dev/null; then
    line="$(grep -nE '^# ' README.md | head -1 | cut -d: -f1)"
    awk -v n="$line" -v badge="$BADGE_MD" 'NR==n{print;print "";print badge;print "";next}1' README.md > README.md.tmp && mv README.md.tmp README.md
  else
    printf "%s\n\n%s\n" "$BADGE_MD" "$(cat README.md)" > README.md.tmp && mv README.md.tmp README.md
  fi
  echo "✅ Added badge to README.md"
else
  echo "ℹ️ README already contains the adversarial badge."
fi

echo ""
echo "📊 Badge will render at: $BADGE_URL"
echo "📄 To commit and push:"
echo "   git add README.md"
echo "   git commit -m 'docs(readme): add adversarial parity badge'"
echo "   git push"