import pytest
# --- Pytest markers ---
def pytest_configure(config):
    for name in [
        "headline_mismatch","date_mismatch","cta_absent_in_prose","cta_domain_bad",
        "claim_not_in_prose","evidence_insufficient","event_missing","poll_methodology_missing",
        "contact_personal_email"
    ]:
        config.addinivalue_line("markers", f"{name}: adversarial scenario filter")

import csv, json, os, subprocess, sys, re, tempfile, pytest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CSV = os.path.join(ROOT, "adversarial_mismatch_dataset.csv")

SCHEMA = os.path.join(ROOT, "cpo_jsonschema_v1.json")
PROFILES = os.path.join(ROOT, "cpo_subtype_profiles.json")
LINTER = os.path.join(ROOT, "cpo_linter.py")
ALLOWLIST = os.path.join(ROOT, "domain_allowlist.json")

def have(p): return os.path.isfile(p)

def extract_jsonld(html_path):
    html = open(html_path, "r", encoding="utf-8").read()
    m = re.search(r'<script type="application/ld\+json">\s*(\{.*\})\s*</script>', html, re.S)
    assert m, "No JSON-LD snippet found in HTML"
    return json.loads(m.group(1))

def run_linter_on_json(doc):
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tf:
        json.dump(doc, tf, indent=2)
        tf.flush()
        tmp = tf.name

    if not have(LINTER):
        pytest.skip("cpo_linter.py not found at repo root")
    cmd = [sys.executable, LINTER, tmp, "--schema", SCHEMA, "--profiles", PROFILES]
    if have(ALLOWLIST):
        try:
            allowed = ",".join(json.load(open(ALLOWLIST))["allowed_domains"])
            cmd.extend(["--allowed", allowed])
        except Exception:
            pass
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return proc.returncode, proc.stdout, proc.stderr

def load_cases():
    with open(CSV, "r", encoding="utf-8") as f:
        r = csv.DictReader(f)
        return list(r)

CASES = load_cases()

@pytest.mark.parametrize(
    "row",
    [pytest.param(r, marks=getattr(pytest.mark, r['scenario_tag'].lower(), pytest.mark.none)) for r in CASES[:200]]
)  # sample for speed
def test_case(row):
    page = os.path.join(os.path.dirname(__file__), "pages", f"{row['doc_id']}.html")
    assert os.path.isfile(page), f"Missing HTML page for {row['doc_id']}"
    doc = extract_jsonld(page)
    code, out, err = run_linter_on_json(doc)
    assert code != 0, f"Linter unexpectedly passed for {row['doc_id']} ({row['scenario_tag']}).\nSTDOUT:\n{out}\nSTDERR:\n{err}"
