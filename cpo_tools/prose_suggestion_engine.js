/* Prose Suggestion Engine (multi-subtype aware, tone-aware templates) */
export const defaultHeuristics = {
  headline: { required: true, cues: ["headline","announces","statement"] },
  datePublished: { required: true, cues: ["today","on ","dated"] },
  "cpo:subtype": { required: true, cues: ["announcement","policy","endorsement","fundraising","crisis","mobilization","operations","news"] },
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
  const events = subjectOf.filter(x => safeArray(x && x["@type"]).includes("Event"));
  const author = jsonld.author || {};
  const cta = jsonld["cpo:cta"] || {};
  const subtypes = safeArray(jsonld["cpo:subtype"]).filter(Boolean);
  return {
    types, claims, events, author, cta,
    headline: jsonld.headline || "",
    datePublished: jsonld.datePublished || "",
    subtypes,
    primarySubtype: subtypes[0] || "",
    endorser: jsonld.endorser || jsonld["cpo:endorser"] || null,
    location: jsonld.location || null
  };
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
  const ents = extractEntities(jsonld);
  const gaps = [];
  const reqs = [
    { key: "headline", val: ents.headline },
    { key: "datePublished", val: ents.datePublished },
    { key: "cpo:subtype", val: ents.subtypes.join(",") }
  ];
  const opts = [
    { key: "endorser", val: ents.endorser },
    { key: "location", val: ents.location },
    { key: "cpo:claims", val: ents.claims && ents.claims.length ? "[claims]" : null },
    { key: "cpo:cta", val: ents.cta && ents.cta.url ? ents.cta.url : null }
  ];
  for (const r of reqs){
    const covered = proseCovers(proseText, r.key, r.val, heuristics);
    if(!covered) gaps.push({ key:r.key, value:r.val, required:true });
  }
  for (const o of opts){
    if(!o.val) continue;
    const covered = proseCovers(proseText, o.key, o.val, heuristics);
    if(!covered) gaps.push({ key:o.key, value:o.val, required:false });
  }
  if (ents.events.length){
    const names = ents.events.map(e => e.name).filter(Boolean);
    if (names.length && !names.some(n => proseText.toLowerCase().includes(String(n).toLowerCase()))) {
      gaps.push({ key:"Event", value:names[0], required:false });
    }
  }
  return { entities: ents, gaps };
}

/* Map detailed codes to high-level families for template selection */
function chooseSubtypeFamily(subtypes){
  const fam = (code)=>{
    const c = String(code||"");
    if (c.startsWith("ANN.")) return "ANN";
    if (c.startsWith("POL.") || c.startsWith("POLICY.")) return "POLICY";
    if (c.startsWith("END.") || c.startsWith("ENDORSE")) return "ENDORSEMENT";
    if (c.startsWith("FUND.") || c.startsWith("FR.")) return "FUNDRAISING";
    if (c.startsWith("CRI.") || c.startsWith("CRISIS")) return "CRISIS";
    if (c.startsWith("MOB.") || c.startsWith("GRA.") || c.startsWith("MOBIL")) return "MOBILIZATION";
    if (c.startsWith("OPS.") || c.startsWith("OPER")) return "OPS";
    if (c.startsWith("NEWS.")) return "NEWS";
    return c || "default";
  };
  if (!subtypes || !subtypes.length) return "default";
  return fam(subtypes[0]) || "default"; // primary is first
}

export async function generateSuggestions({ proseText, jsonld, llmFn, prompts, style = "neutral" }){
  const { gaps, entities } = analyzeCoherence({ proseText, jsonld });
  const out = [];
  const subtypes = entities.subtypes;
  const primaryFamily = chooseSubtypeFamily(subtypes);

  for (const gap of gaps){
    const tpl = pickTemplate({ gap, prompts, style, subtypes, primaryFamily });
    const filled = fillTemplate(tpl, { gap, jsonld, primarySubtype: entities.primarySubtype });
    let variants = [];
    if (llmFn){
      const sys = (prompts && prompts.system) || "";
      const styleHint = (prompts && prompts.styles && prompts.styles[style]) ? "Tone: " + prompts.styles[style] + "." : "";
      const hint = "Context subtype(s): " + subtypes.join(", ") + ". Primary family: " + primaryFamily + ".";
      const res = await llmFn({ system: sys, prompt: styleHint + "\n" + hint + "\n" + filled });
      variants = [res && res.text ? res.text.trim() : filled];
    } else {
      variants = [filled];
    }
    out.push({ missing_field: gap.key, value: gap.value, required: !!gap.required, suggestions: variants });
  }
  return out;
}

export function pickTemplate({ gap, prompts, style, subtypes, primaryFamily }){
  const lib = (prompts && prompts.templates) || {};
  const key = gap.key;

  // Prefer family+field (e.g., templates.ENDORSEMENT.endorser.campaign[0])
  const famBlock = lib[primaryFamily] || {};
  const famField = famBlock[key];
  if (famField){
    const styled = famField[style] || famField["neutral"] || famField;
    if (Array.isArray(styled) && styled.length) return styled[0];
  }

  // Then field-only block (e.g., templates.endorser.campaign[0])
  const byField = lib[key];
  if (byField){
    const styled = byField[style] || byField["neutral"] || byField;
    if (Array.isArray(styled) && styled.length) return styled[0];
  }

  // Then family default
  if (famBlock && famBlock.default){
    const styled = famBlock.default[style] || famBlock.default["neutral"] || famBlock.default;
    if (Array.isArray(styled) && styled.length) return styled[0];
  }

  // Global default
  const def = lib.default || {};
  const styled = def[style] || def["neutral"] || [];
  return Array.isArray(styled) && styled.length ? styled[0] : "Write one sentence addressing {{key}} ({{value}}).";
}

export function fillTemplate(tpl, ctx){
  const subtype = ctx.primarySubtype || (ctx.jsonld && ctx.jsonld["cpo:subtype"]) || "";
  return String(tpl)
    .replaceAll("{{key}}", ctx.gap.key)
    .replaceAll("{{value}}", String(ctx.gap.value || ""))
    .replaceAll("{{subtype}}", Array.isArray(subtype)?subtype.join(","):subtype)
    .replaceAll("{{headline}}", (ctx.jsonld && ctx.jsonld.headline) || "");
}
