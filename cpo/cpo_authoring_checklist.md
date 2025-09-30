# CPO Authoring Checklist (Dual-Layer Markup)

**Goals:** Neutral labeling, evidence-backed claims, parity between prose and markup, and compatibility with schema.org.

## 1) Always include schema.org core
- @type: PressRelease (or NewsArticle where appropriate)
- headline, datePublished, inLanguage, author (Organization), articleBody
- contactPoint must be a role account (press@campaign.org), not personal PII

## 2) Add CPO extension neutrally
- cpo:releaseType (announcement|endorsement|fundraising|policy|contrast|crisis|mobilization|operations)
- cpo:subtype (taxonomy leaf, e.g., ANN.EVT.RALLY)
- cpo:tone (positive|negative|neutral|mixed)
- cpo:issueArea (economy|healthcare|education|environment|defense|immigration|justice|technology|election_process|other)
- cpo:claims with cpo:evidence (links + excerpts) for any factual assertion

## 3) Page ↔ Markup Parity
- Headline, datePublished, key claims, and CTAs must appear on the visible page.
- Do not include endorsements, stats, or quotes in JSON-LD if not present on-page.
- Link to sources in the body where feasible and mirror them in cpo:evidence.

## 4) Governance & Versioning
- Host context at stable URL `/ns/v1#` and freeze it.
- Changes create new versions: `/ns/v1.1#` (compatible), `/ns/v2#` (breaking).
- Maintain a public changelog and migration guides.

## 5) Neutral Labeling
- Use neutral naming (cpo:*). Avoid partisan prefixes or properties.
- Keep schema.org fields first; use extension to augment, not replace.
- Ensure fields are descriptive, not persuasive.

## 6) Claim Review & Fact-Checking
- Use cpo:Claim with cpo:evidence (multiple sources preferred).
- Optionally add schema:ClaimReview objects on separate pages; link via sameAs/isBasedOn.
- Archive critical sources and store capture dates in evidence.

## 7) QA Before Publish
- Validate JSON-LD against `cpo_jsonschema_v1.json` and `cpo_shacl_v1.ttl`.
- Run parity checker to confirm agreement between markup and prose.
- Check all evidence links return 200-OK.
