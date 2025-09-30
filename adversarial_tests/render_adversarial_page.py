#!/usr/bin/env python3
import argparse, csv, json, os, sys, urllib.parse as up

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CSV = os.path.join(ROOT, "adversarial_mismatch_dataset.csv")
PAGES_DIR = os.path.join(ROOT, "pages")

def load_rows():
    with open(CSV, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def esc_html(s):
    return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("\n","<br/>\n")

def inject_event(jsonld):
    ev = {"@type":"Event","name":"Rally at Mall B","startDate":"2025-10-04T15:00:00-04:00","location":{"@type":"Place","name":"Mall B","address":"300 Lakeside Ave, Cleveland, OH"}}
    subj = jsonld.get("subjectOf")
    if isinstance(subj, list):
        subj.append(ev)
    elif isinstance(subj, dict):
        jsonld["subjectOf"] = [subj, ev]
    else:
        jsonld["subjectOf"] = [ev]
    return jsonld

def write_page(doc_id, prose, jsonld_obj, out_dir):
    html = "<!doctype html><html lang='en'><head><meta charset='utf-8'/><title>{}</title></head><body><main><article>{}</article></main><script type='application/ld+json'>{}</script></body></html>".format(
        doc_id, esc_html(prose), json.dumps(jsonld_obj, indent=2)
    )
    path = os.path.join(out_dir, "{}.html".format(doc_id))
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    return path

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("doc_id")
    ap.add_argument("--inject-event", action="store_true")
    ap.add_argument("--fix-contact", action="store_true")
    ap.add_argument("--fix-cta-domain")
    ap.add_argument("--out-dir", default=PAGES_DIR)
    args = ap.parse_args()

    rows = load_rows()
    row = next((r for r in rows if r["doc_id"] == args.doc_id), None)
    if not row:
        print("doc_id not found", file=sys.stderr); sys.exit(2)
    prose = row["prose_text"]
    jsonld = json.loads(row["jsonld_snippet"])

    if args.inject_event:
        jsonld = inject_event(jsonld)
    if args.fix_contact:
        cp = ((jsonld.get("author") or {}).get("contactPoint") or {})
        if isinstance(cp, dict) and cp.get("email"):
            cp["email"] = "press@janesmithforcongress.org"
            jsonld["author"]["contactPoint"] = cp
    if args.fix_cta_domain:
        cta = jsonld.get("cpo:cta") or {}
        url = cta.get("url")
        if url:
            u = up.urlparse(url); cta["url"] = u._replace(netloc=args.fix_cta_domain).geturl()
            jsonld["cpo:cta"] = cta

    os.makedirs(args.out_dir, exist_ok=True)
    path = write_page(args.doc_id, prose, jsonld, args.out_dir)
    print(path)

if __name__ == "__main__":
    main()
