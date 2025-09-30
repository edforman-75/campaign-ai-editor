# Campaign Press Office (CPO) Documentation

This repository contains the **Campaign Press Office (CPO)** templates, examples, and supporting files
for training and validating JSON-LD press release markup.

All files follow a dual-layer JSON-LD pattern:
- **schema.org core**: ensures broad adoption by platforms and search engines.
- **CPO extension namespace** (`https://campaign-press-ontology.org/ns/v1#`): adds campaign-specific semantics.

---

## 📂 Directories

### [`cpo_templates/`](../cpo_templates)
Authoring templates for different types of press releases.
- Generic press release
- Statements / clarifications
- Policy rollouts
- Endorsements
- Fundraising
- Crisis / corrections
- Mobilization
- Operations (polling, logistics)
- News article variant
- ClaimReview template

See [cpo_templates/README.md](../cpo_templates/README.md) for details.

---

### [`cpo_examples/`](../cpo_examples)
Example JSON-LD files showing filled-in releases.
- Rally announcement with embedded Event
- Contrast release with claims and evidence

See [cpo_examples/README.md](../cpo_examples/README.md) for details.

---

## 🛠 Usage

1. **Choose a template** from `cpo_templates/`.
2. Fill in placeholders (`<slug>`, `<headline>`, etc.) with campaign data.
3. Use examples in `cpo_examples/` as references for real-world structure.
4. Run the linter to check:
   - Required subtype fields (e.g., rally requires `Event`).
   - Role-based contacts only.
   - CTA domains are on the allowlist.
   - Claims include sufficient evidence.

---

## 🔍 Notes
- Templates and examples are **neutral** in structure so platforms won't ignore them.
- Evidence URLs should return HTTP 200 and be on the domain allowlist.
- Subtype-specific requirements are enforced by the validation toolkit.