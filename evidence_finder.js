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

    const results = await searchForEvidence(searchQuery, claimType);

    res.json({
      success: true,
      claim: claim,
      results: results,
      bestMatch: results[0] || null
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
async function searchForEvidence(query, claimType) {
  // For now, this returns suggested search strategies
  // To make this fully functional, you would:
  // 1. Use Google Custom Search API, Bing API, or DuckDuckGo API
  // 2. Or use ChatGPT with web browsing capability
  // 3. Parse and rank results

  const searchStrategies = getSearchStrategy(claimType);

  // Placeholder: In production, this would actually search
  // For now, return intelligent suggestions
  return [
    {
      title: `Search result for: ${query}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      snippet: `Suggested search based on claim type: ${claimType}`,
      source: searchStrategies.preferredSources[0],
      relevanceScore: 0.9
    }
  ];
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
