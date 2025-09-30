/**
 * Evidence Finder API
 * Finds evidence URLs for factual claims using web search
 * Can be enhanced with ChatGPT/Claude API for better results
 */

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

/**
 * Find evidence for a claim
 * POST /api/find-evidence
 * Body: { claim: string, claimType: string, searchQuery: string }
 */
app.post('/api/find-evidence', async (req, res) => {
  try {
    const { claim, claimType, searchQuery } = req.body;

    console.log(`Searching for evidence: ${claim}`);
    console.log(`Claim type: ${claimType}`);
    console.log(`Search query: ${searchQuery}`);

    // Strategy: Use web search to find relevant pages
    // Then optionally use ChatGPT/Claude to validate and rank results

    const results = await searchForEvidence(searchQuery, claimType, claim);

    const bestMatch = results[0] || null;

    // Check if confidence is below threshold
    const meetsThreshold = bestMatch &&
                          bestMatch.confidence &&
                          bestMatch.confidence.score >= bestMatch.confidence.threshold;

    res.json({
      success: true,
      claim: claim,
      results: results,
      bestMatch: bestMatch,
      confidence: bestMatch ? bestMatch.confidence : null,
      meetsThreshold: meetsThreshold,
      warning: !meetsThreshold ? 'Evidence does not meet confidence threshold - additional sources recommended' : null
    });

  } catch (error) {
    console.error('Error finding evidence:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Search for evidence using web search
 */
async function searchForEvidence(query, claimType, claim) {
  // Try ChatGPT first if available
  const chatGptResult = await findEvidenceWithChatGPT(claim, claimType);

  if (chatGptResult && chatGptResult.url) {
    // Evaluate confidence score
    const confidence = evaluateEvidenceConfidence(claim, chatGptResult, claimType);

    return [{
      title: chatGptResult.source || 'Evidence Found',
      url: chatGptResult.url,
      snippet: chatGptResult.excerpt || '',
      source: chatGptResult.source || extractDomain(chatGptResult.url),
      relevanceScore: confidence.score,
      confidence: confidence,
      reliability: chatGptResult.reliability || ''
    }];
  }

  // Fallback: return search suggestions
  const searchStrategies = getSearchStrategy(claimType);

  return [
    {
      title: `Search result for: ${query}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      snippet: `Suggested search based on claim type: ${claimType}`,
      source: searchStrategies.preferredSources[0],
      relevanceScore: 0.0, // Unknown - requires manual verification
      confidence: {
        score: 0.0,
        level: 'unknown',
        reason: 'Automatic evidence search not available - manual verification required'
      }
    }
  ];
}

/**
 * Evaluate confidence that evidence supports the claim
 * Returns score from 0.0 (no support) to 1.0 (strong support)
 */
function evaluateEvidenceConfidence(claim, evidence, claimType) {
  let score = 0.5; // Start neutral
  let level = 'medium';
  let reason = '';
  const factors = [];

  // Factor 0: Assertion strength - detect hedging/suggestive language
  const assertiveness = evaluateAssertionStrength(claim);
  if (assertiveness.isHedged) {
    factors.push(`Hedged claim (${assertiveness.strength}): ${assertiveness.hedgeWords.join(', ')}`);
  }

  // Factor 1: Source reliability
  const domain = evidence.url ? extractDomain(evidence.url) : '';
  const sourceScore = evaluateSourceReliability(domain, claimType);
  score += sourceScore.adjustment;
  factors.push(sourceScore.reason);

  // Factor 2: Excerpt relevance (if available)
  if (evidence.excerpt) {
    const relevanceScore = calculateTextRelevance(claim, evidence.excerpt);
    score += relevanceScore.adjustment;
    factors.push(relevanceScore.reason);
  } else {
    score -= 0.1;
    factors.push('No excerpt available for verification');
  }

  // Factor 3: Claim type requirements
  const typeRequirements = getSearchStrategy(claimType);
  if (typeRequirements.factCheckRequired && !isFactCheckSource(domain)) {
    score -= 0.2;
    factors.push('Fact-checking required but source is not a fact-checker');
  }

  // Normalize score to 0.0-1.0 range
  score = Math.max(0.0, Math.min(1.0, score));

  // Determine confidence level
  if (score >= 0.8) {
    level = 'high';
    reason = 'Strong evidence from reliable source';
  } else if (score >= 0.6) {
    level = 'medium';
    reason = 'Moderate evidence - additional verification recommended';
  } else if (score >= 0.4) {
    level = 'low';
    reason = 'Weak evidence - requires additional sources';
  } else {
    level = 'insufficient';
    reason = 'Insufficient evidence - cannot verify claim';
  }

  return {
    score: Math.round(score * 100) / 100,
    level: level,
    reason: reason,
    factors: factors,
    assertiveness: assertiveness,
    threshold: getThresholdForClaimType(claimType, assertiveness.strength)
  };
}

/**
 * Evaluate assertion strength - detect hedging language and question forms
 * Returns strength classification: definitive, suggestive, questioning, speculative
 */
function evaluateAssertionStrength(claim) {
  const claimLower = claim.toLowerCase();

  // Hedging words that soften claims
  const hedgeWords = {
    // Speculation/possibility
    'may': 'speculative',
    'might': 'speculative',
    'could': 'speculative',
    'would': 'speculative',
    'possibly': 'speculative',
    'perhaps': 'speculative',

    // Appearance/suggestion
    'appears to': 'suggestive',
    'seems to': 'suggestive',
    'suggests': 'suggestive',
    'indicates': 'suggestive',
    'implies': 'suggestive',
    'raises questions about': 'suggestive',
    'raises concerns about': 'suggestive',

    // Qualification
    'allegedly': 'qualified',
    'reportedly': 'qualified',
    'claims to': 'qualified',
    'said to': 'qualified',

    // Probability
    'likely': 'probable',
    'probably': 'probable',
    'tends to': 'probable'
  };

  const foundHedges = [];
  let strongestHedge = null;

  // Check for hedging words
  for (const [word, type] of Object.entries(hedgeWords)) {
    if (claimLower.includes(word)) {
      foundHedges.push(word);
      if (!strongestHedge || type === 'speculative') {
        strongestHedge = type;
      }
    }
  }

  // Check for question marks (rhetorical questions)
  const isQuestion = claim.includes('?');
  if (isQuestion) {
    return {
      strength: 'questioning',
      isHedged: true,
      hedgeWords: ['rhetorical question'],
      description: 'Rhetorical question - implies rather than asserts',
      evidenceGuidance: 'Evidence should support the implied assertion, not the question itself'
    };
  }

  // Check for definitive language
  const definitiveWords = ['will', 'has', 'is', 'are', 'was', 'were', 'voted', 'passed', 'failed', 'rejected'];
  const hasDefinitive = definitiveWords.some(word => {
    const pattern = new RegExp(`\\b${word}\\b`, 'i');
    return pattern.test(claim);
  });

  // Determine overall strength
  if (foundHedges.length === 0 && hasDefinitive) {
    return {
      strength: 'definitive',
      isHedged: false,
      hedgeWords: [],
      description: 'Definitive assertion - requires strong evidence',
      evidenceGuidance: 'Must provide authoritative sources'
    };
  } else if (strongestHedge === 'speculative') {
    return {
      strength: 'speculative',
      isHedged: true,
      hedgeWords: foundHedges,
      description: 'Speculative claim - suggests possibility',
      evidenceGuidance: 'Evidence should support plausibility, not certainty'
    };
  } else if (strongestHedge === 'suggestive') {
    return {
      strength: 'suggestive',
      isHedged: true,
      hedgeWords: foundHedges,
      description: 'Suggestive claim - implies without asserting',
      evidenceGuidance: 'Evidence should support the implication'
    };
  } else if (foundHedges.length > 0) {
    return {
      strength: 'qualified',
      isHedged: true,
      hedgeWords: foundHedges,
      description: 'Qualified claim - contains hedging language',
      evidenceGuidance: 'Evidence requirements are relaxed due to qualification'
    };
  } else {
    return {
      strength: 'neutral',
      isHedged: false,
      hedgeWords: [],
      description: 'Neutral claim - standard evidence required',
      evidenceGuidance: 'Standard evidence verification applies'
    };
  }
}

/**
 * Evaluate source reliability based on domain
 */
function evaluateSourceReliability(domain, claimType) {
  const highReliability = [
    'gov', 'congress.gov', 'senate.gov', 'house.gov',
    'cbo.gov', 'gao.gov', 'census.gov', 'bls.gov',
    'politifact.com', 'factcheck.org', 'snopes.com',
    'votesmart.org', 'ballotpedia.org',
    'brookings.edu', 'pewresearch.org'
  ];

  const mediumReliability = [
    'edu', 'org',
    'nytimes.com', 'washingtonpost.com', 'wsj.com',
    'apnews.com', 'reuters.com', 'bloomberg.com',
    'politico.com', 'thehill.com', 'npr.org', 'pbs.org'
  ];

  const lowReliability = [
    'linkedin.com', 'wikipedia.org', 'twitter.com', 'facebook.com'
  ];

  // Check exact matches first
  for (const trusted of highReliability) {
    if (domain.includes(trusted)) {
      return { adjustment: 0.3, reason: `High-reliability source: ${domain}` };
    }
  }

  for (const medium of mediumReliability) {
    if (domain.includes(medium)) {
      return { adjustment: 0.1, reason: `Medium-reliability source: ${domain}` };
    }
  }

  for (const low of lowReliability) {
    if (domain.includes(low)) {
      return { adjustment: -0.1, reason: `Lower-reliability source (should be verified): ${domain}` };
    }
  }

  return { adjustment: 0.0, reason: `Unknown source reliability: ${domain}` };
}

/**
 * Calculate text relevance between claim and evidence excerpt
 */
function calculateTextRelevance(claim, excerpt) {
  const claimWords = claim.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const excerptLower = excerpt.toLowerCase();

  let matches = 0;
  for (const word of claimWords) {
    if (excerptLower.includes(word)) matches++;
  }

  const relevance = claimWords.length > 0 ? matches / claimWords.length : 0;

  if (relevance >= 0.5) {
    return { adjustment: 0.2, reason: `High text relevance (${Math.round(relevance * 100)}% keyword match)` };
  } else if (relevance >= 0.3) {
    return { adjustment: 0.1, reason: `Moderate text relevance (${Math.round(relevance * 100)}% keyword match)` };
  } else {
    return { adjustment: -0.1, reason: `Low text relevance (${Math.round(relevance * 100)}% keyword match)` };
  }
}

/**
 * Check if domain is a fact-checking source
 */
function isFactCheckSource(domain) {
  const factCheckers = ['politifact.com', 'factcheck.org', 'snopes.com', 'fullfact.org'];
  return factCheckers.some(fc => domain.includes(fc));
}

/**
 * Get confidence threshold for claim type
 * Adjusted based on assertion strength (hedged claims have lower thresholds)
 */
function getThresholdForClaimType(claimType, assertionStrength = 'neutral') {
  const baseThresholds = {
    'policy_claim': 0.7,        // High threshold - needs strong evidence
    'policy_document': 0.7,     // High threshold - needs verification
    'factual_claim': 0.7,       // High threshold - must be factual
    'voting_record': 0.8,       // Very high - must be official record
    'statistic': 0.7,           // High threshold - needs official source
    'experience': 0.5,          // Medium - can use LinkedIn, bios
    'org_description': 0.5,     // Medium - official sites acceptable
    'org_composition': 0.5      // Medium - official sites acceptable
  };

  let threshold = baseThresholds[claimType] || 0.6;

  // Adjust threshold based on assertion strength
  // Hedged/suggestive claims have lower evidence requirements
  const adjustments = {
    'definitive': 0.0,          // Full threshold - definitive claims need strong evidence
    'neutral': 0.0,             // Standard threshold
    'qualified': -0.1,          // Slightly lower - "reportedly", "allegedly"
    'probable': -0.15,          // Lower - "likely", "probably"
    'suggestive': -0.2,         // Significantly lower - "suggests", "appears to"
    'speculative': -0.25,       // Much lower - "may", "could", "might"
    'questioning': -0.3         // Lowest - rhetorical questions that imply
  };

  const adjustment = adjustments[assertionStrength] || 0.0;
  threshold = Math.max(0.3, threshold + adjustment); // Minimum threshold of 0.3

  return threshold;
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return url;
  }
}

/**
 * Get search strategy based on claim type
 */
function getSearchStrategy(claimType) {
  const strategies = {
    'experience': {
      preferredSources: ['linkedin.com', 'campaign websites', 'news articles'],
      siteRestrictions: 'site:linkedin.com OR site:*.com/about',
      factCheckRequired: false
    },
    'org_description': {
      preferredSources: ['official .org sites', 'Wikipedia', 'news'],
      siteRestrictions: 'site:*.org OR site:wikipedia.org',
      factCheckRequired: false
    },
    'org_composition': {
      preferredSources: ['organization about pages', 'member directories'],
      siteRestrictions: 'site:*.org/about OR site:*.org/members',
      factCheckRequired: false
    },
    'policy_document': {
      preferredSources: ['Politifact', 'FactCheck.org', '.gov sites'],
      siteRestrictions: 'site:politifact.com OR site:factcheck.org OR site:*.gov',
      factCheckRequired: true
    },
    'voting_record': {
      preferredSources: ['Congress.gov', 'VoteSmart.org', 'official records'],
      siteRestrictions: 'site:congress.gov OR site:votesmart.org',
      factCheckRequired: false
    },
    'policy_claim': {
      preferredSources: ['CBO', '.gov analysis', '.edu research'],
      siteRestrictions: 'site:cbo.gov OR site:*.gov OR site:*.edu',
      factCheckRequired: true
    },
    'factual_claim': {
      preferredSources: ['fact-checking sites', 'reputable news'],
      siteRestrictions: 'site:politifact.com OR site:factcheck.org OR site:snopes.com',
      factCheckRequired: true
    },
    'statistic': {
      preferredSources: ['Census', 'BLS', 'government stats', 'Pew Research'],
      siteRestrictions: 'site:census.gov OR site:bls.gov OR site:pewresearch.org',
      factCheckRequired: false
    }
  };

  return strategies[claimType] || {
    preferredSources: ['reputable news', '.gov/.edu sites'],
    siteRestrictions: '',
    factCheckRequired: false
  };
}

/**
 * Optional: Use ChatGPT to validate and find evidence
 * Requires OpenAI API key in environment
 */
async function findEvidenceWithChatGPT(claim, claimType) {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    console.log('OpenAI API key not set - skipping ChatGPT search');
    return null;
  }

  try {
    // Use ChatGPT with web browsing (requires GPT-4 with plugins or browsing mode)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a fact-checker helping find evidence URLs for campaign press release claims.
                     Focus on authoritative sources like .gov sites, fact-checking organizations,
                     official records, and reputable news outlets.`
          },
          {
            role: 'user',
            content: `Find the best evidence URL for this claim: "${claim}"

                     Claim type: ${claimType}

                     Please provide:
                     1. The most authoritative URL that supports or documents this claim
                     2. A brief explanation of why this source is reliable
                     3. A relevant excerpt or quote from the source

                     Format as JSON:
                     {
                       "url": "https://...",
                       "source": "Source name",
                       "reliability": "Why this is reliable",
                       "excerpt": "Relevant quote"
                     }`
          }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content;

      // Try to parse JSON from response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.log('Could not parse ChatGPT JSON response');
      }

      return { rawResponse: content };
    }

  } catch (error) {
    console.error('ChatGPT search error:', error);
    return null;
  }

  return null;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Evidence Finder API' });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Evidence Finder API running on port ${PORT}`);
  console.log(`\nTo use with the press release editor:`);
  console.log(`1. Make sure CORS is enabled`);
  console.log(`2. Update the editor to call http://localhost:${PORT}/api/find-evidence`);
  console.log(`\nOptional: Set OPENAI_API_KEY environment variable to enable ChatGPT search`);
});

module.exports = app;
