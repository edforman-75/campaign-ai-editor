# Adversarial Parity & Validation — HTML + Pytest

This suite builds one HTML page per adversarial case and uses `cpo_linter.py` to ensure mismatches are detected.

## Structure
- `pages/*.html` — fixtures containing prose + embedded JSON-LD
- `test_adversarial.py` — extracts JSON-LD and runs the linter
- `adversarial_mismatch_dataset.csv` — the source CSV

## How to run
```bash
pip install pytest jsonschema
pytest -q adversarial_tests/test_adversarial.py
```
Edit `test_adversarial.py` to remove the `[:200]` slice to run all cases.

Repo root must include: `cpo_linter.py`, `cpo_jsonschema_v1.json`, `cpo_subtype_profiles.json`, and optionally `domain_allowlist.json`.
