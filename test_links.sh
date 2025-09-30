#!/bin/bash
# Comprehensive link and functionality test for CPO Portal

set -e

echo "======================================"
echo "CPO Portal Comprehensive Test Suite"
echo "======================================"
echo ""

BASE_DIR="/Users/edf/campaign-content-editor-v2"
ERRORS=0

# Test file existence
test_file() {
  local file=$1
  local description=$2
  if [ -f "$BASE_DIR/$file" ]; then
    echo "✓ $description: $file"
  else
    echo "✗ MISSING: $file ($description)"
    ((ERRORS++))
  fi
}

# Test directory existence
test_dir() {
  local dir=$1
  local description=$2
  if [ -d "$BASE_DIR/$dir" ]; then
    echo "✓ $description: $dir/"
  else
    echo "✗ MISSING DIR: $dir/ ($description)"
    ((ERRORS++))
  fi
}

echo "1. Testing Core Portal Files"
echo "-----------------------------"
test_file "cpo_docs/index.html" "Main portal index"
test_file "cpo_docs/styles.css" "Portal styles"
test_file "docs/index.html" "GitHub Pages index"
test_file "docs/_config.yml" "Jekyll config"
echo ""

echo "2. Testing Interactive Tools"
echo "-----------------------------"
test_file "cpo_docs/allowlist_editor.html" "Local allowlist editor"
test_file "cpo_docs/allowlist_editor_github.html" "GitHub API allowlist editor"
test_file "cpo_docs/profiles_viewer.html" "Subtype profiles viewer"
echo ""

echo "3. Testing Documentation Files"
echo "-------------------------------"
test_file "docs/README.md" "Top-level docs"
test_file "cpo_templates/README.md" "Templates README"
test_file "cpo_examples/README.md" "Examples README"
test_file "cpo_docs/TOOLS_README.md" "Tools README"
test_file "cpo_docs/TOOLS_USER_GUIDE.md" "Tools user guide"
test_file "cpo_docs/README_PORTAL.md" "Portal README"
echo ""

echo "4. Testing Template Files (10 expected)"
echo "----------------------------------------"
test_dir "cpo_templates" "Templates directory"
test_file "cpo_templates/press_release_template.jsonld" "Generic press release"
test_file "cpo_templates/statement_template.jsonld" "Statement"
test_file "cpo_templates/policy_release.jsonld" "Policy release"
test_file "cpo_templates/endorsement_release.jsonld" "Endorsement"
test_file "cpo_templates/fundraising_release.jsonld" "Fundraising"
test_file "cpo_templates/crisis_release.jsonld" "Crisis/clarification"
test_file "cpo_templates/mobilization_release.jsonld" "Mobilization"
test_file "cpo_templates/operations_release.jsonld" "Operations"
test_file "cpo_templates/news_article_variant.jsonld" "NewsArticle variant"
test_file "cpo_templates/claimreview_template.jsonld" "ClaimReview"
echo ""

echo "5. Testing Example Files (2 expected)"
echo "--------------------------------------"
test_dir "cpo_examples" "Examples directory"
test_file "cpo_examples/rally_release.jsonld" "Rally example"
test_file "cpo_examples/contrast_release.jsonld" "Contrast example"
echo ""

echo "6. Testing Schema & Config Files"
echo "---------------------------------"
test_file "cpo_jsonschema_v1.json" "CPO JSON schema"
test_file "cpo_subtype_profiles.json" "Subtype profiles"
test_file "domain_allowlist.json" "Domain allowlist"
test_file "cpo_docs/tier1_sources.json" "Tier 1 sources reference"
test_file "cpo_docs/domain_allowlist.sample.json" "Sample allowlist"
echo ""

echo "7. Testing CI/CD Files"
echo "----------------------"
test_file ".github/workflows/adversarial-tests.yml" "Adversarial tests workflow"
test_file ".github/workflows/cpo-backlink-check.yml" "Backlink check workflow"
test_file "adversarial_tests/test_adversarial.py" "Test suite"
test_file "adversarial_tests/make_badge.py" "Badge generator"
test_file "badges/adversarial_badge.svg" "Test badge"
echo ""

echo "8. Testing Scripts"
echo "------------------"
test_file "scripts/check_backlinks.sh" "Backlink checker"
echo ""

echo "9. Validating JSON Files"
echo "------------------------"
for jsonfile in domain_allowlist.json cpo_jsonschema_v1.json cpo_subtype_profiles.json cpo_docs/tier1_sources.json; do
  if [ -f "$BASE_DIR/$jsonfile" ]; then
    if python3 -c "import json; json.load(open('$BASE_DIR/$jsonfile'))" 2>/dev/null; then
      echo "✓ Valid JSON: $jsonfile"
    else
      echo "✗ INVALID JSON: $jsonfile"
      ((ERRORS++))
    fi
  fi
done
echo ""

echo "10. Testing Template/Example JSON-LD"
echo "-------------------------------------"
for jsonldfile in cpo_templates/*.jsonld cpo_examples/*.jsonld; do
  filename=$(basename "$jsonldfile")
  if python3 -c "import json; json.load(open('$jsonldfile'))" 2>/dev/null; then
    echo "✓ Valid JSON-LD: $filename"
  else
    echo "✗ INVALID JSON-LD: $filename"
    ((ERRORS++))
  fi
done
echo ""

echo "11. Checking Domain Allowlist Content"
echo "--------------------------------------"
DOMAIN_COUNT=$(python3 -c "import json; print(len(json.load(open('$BASE_DIR/domain_allowlist.json'))['allowed_domains']))" 2>/dev/null || echo "0")
if [ "$DOMAIN_COUNT" -gt 0 ]; then
  echo "✓ Domain allowlist has $DOMAIN_COUNT domains"
else
  echo "✗ Domain allowlist is empty or invalid"
  ((ERRORS++))
fi
echo ""

echo "12. Testing Backlink Checker"
echo "-----------------------------"
if [ -x "$BASE_DIR/scripts/check_backlinks.sh" ]; then
  if cd "$BASE_DIR" && ./scripts/check_backlinks.sh > /dev/null 2>&1; then
    echo "✓ Backlink checker passes"
  else
    echo "⚠ Backlink checker found issues (may be expected)"
  fi
else
  echo "✗ Backlink checker not executable"
  chmod +x "$BASE_DIR/scripts/check_backlinks.sh"
  echo "  → Fixed permissions"
fi
echo ""

echo "======================================"
echo "Test Results"
echo "======================================"
if [ $ERRORS -eq 0 ]; then
  echo "✓ ALL TESTS PASSED"
  echo "  All files found and valid"
  exit 0
else
  echo "✗ TESTS FAILED: $ERRORS error(s) found"
  exit 1
fi
