export const defaultHeuristics = {
  headline: { required: true, cues: ["headline","announces","statement"] },
  datePublished: { required: true, cues: ["today","on ","dated"] },
  "cpo:subtype": { required: true, cues: ["announcement","policy","endorsement","fundraising","crisis","mobilization","operations"] },
  endorser: { required: false, cues: ["endorses","endorsement","backed by"] },
  location: { required: false, cues: ["in ","at "] },
  "cpo:claims": { required: false, cues: ["according to","cites","research","study","estimate"] },
  "cpo:cta": { required: false, cues: ["RSVP","donate","volunteer","learn more","sign up"] }
};
export const safeArray = (x)=>Array.isArray(x)?x:(x==null?[]:[x]);
export function extractEntities(jsonld){
  const types = safeArray(jsonld["@type"]);
  const claims = Array.isArray(jsonld["cpo:claims"]) ? jsonld["cpo:claims"] : [];
  const subjectOf = Array.isArray(jsonld.subjectOf) ? jsonld.subjectOf : [];
  const events = subjectOf.filter(x => { const t = safeArray(x && x["@type"]); return t.includes("Event"); });
  const author = jsonld.author || {};
  const cta = jsonld["cpo:cta"] || {};
  return { types, claims, events, author, cta,
    headline: jsonld.headline || "", datePublished: jsonld.datePublished || "",
    subtype: jsonld["cpo:subtype"] || "", endorser: jsonld.endorser || jsonld["cpo:endorser"] || null,
    location: jsonld.location || null };
}
export function proseCovers(text, fieldKey, entityValue, heuristics = defaultHeuristics){
  const t = (text || "").toLowerCase(); if(!t) return false;
  const rule = heuristics[fieldKey]; if(!rule) return false;
  const cuesFound = (rule.cues || []).some(c => t.includes(c.toLowerCase()));
  let literalFound = false;
  if (typeof entityValue === "string") literalFound = t.includes(entityValue.toLowerCase());
  return cuesFound || literalFound;
}
export function analyzeCoherence({ proseText, jsonld, heuristics = defaultHeuristics }){
  const ents = extractEntities(jsonld); const gaps = [];
  const reqs = [
    { key: "headline", val: ents.headline },
    { key: "datePublished", val: ents.datePublished },
    { key: "cpo:subtype", val: ents.subtype }
  ];
  const opts = [
    { key: "endorser", val: ents.endorser },
    { key: "location", val: ents.location },
    { key: "cpo:claims", val: ents.claims && ents.claims.length ? "[claims]" : null },
    { key: "cpo:cta", val: ents.cta && ents.cta.url ? ents.cta.url : null }
  ];
  for (const r of reqs){ const covered = proseCovers(proseText, r.key, r.val, heuristics); if(!covered) gaps.push({ key:r.key, value:r.val, required:true }); }
  for (const o of opts){ if(!o.val) continue; const covered = proseCovers(proseText, o.key, o.val, heuristics); if(!covered) gaps.push({ key:o.key, value:o.val, required:false }); }
  if (ents.events.length){ const names = ents.events.map(e => e.name).filter(Boolean);
    if (names.length && !names.some(n => proseText.toLowerCase().includes(String(n).toLowerCase()))) {
      gaps.push({ key:"Event", value:names[0], required:false });
    }
  }
  return { entities: ents, gaps };
}
export async function generateSuggestions({ proseText, jsonld, llmFn, prompts, style = "neutral" }){
  const { gaps } = analyzeCoherence({ proseText, jsonld });
  const out = [];
  for (const gap of gaps){
    const tpl = pickTemplate(gap, prompts, style);
    const filled = fillTemplate(tpl, { gap, jsonld });
    let variants = [];
    if (llmFn){ const res = await llmFn({ prompt: filled, system: (prompts && prompts.system) || "" });
      variants = [res && res.text ? res.text.trim() : filled];
    } else { variants = [filled]; }
    out.push({ missing_field: gap.key, value: gap.value, required: !!gap.required, suggestions: variants });
  }
  return out;
}
export function pickTemplate(gap, prompts, style){
  const library = prompts && prompts.templates ? prompts.templates : {};
  const byKey = library[gap.key] || library["default"] || [];
  const group = Array.isArray(byKey) ? byKey : (byKey[style] || byKey["neutral"] || []);
  return group[0] || "Write one sentence addressing the missing field: {{key}} with value {{value}}.";
}
export function fillTemplate(tpl, ctx){
  return String(tpl)
    .replaceAll("{{key}}", ctx.gap.key)
    .replaceAll("{{value}}", String(ctx.gap.value || ""))
    .replaceAll("{{subtype}}", ctx.jsonld["cpo:subtype"] || "")
    .replaceAll("{{headline}}", ctx.jsonld.headline || "");
}
