# Evidence Finder API

Automated evidence URL discovery for campaign press release claims.

## Features

- **Automatic claim detection** from press releases
- **Smart search strategies** based on claim type
- **Optional ChatGPT integration** for intelligent evidence finding
- **Source validation** and relevance scoring
- **REST API** for easy integration

## Quick Start

### 1. Install Dependencies

```bash
npm install express cors
```

### 2. Start the Evidence Finder API

```bash
node evidence_finder.js
```

Server runs on port 3002 by default.

### 3. (Optional) Enable ChatGPT Search

Set your OpenAI API key:

```bash
export OPENAI_API_KEY="sk-..."
node evidence_finder.js
```

## API Endpoints

### POST /api/find-evidence

Find evidence URLs for a claim.

**Request:**
```json
{
  "claim": "extensive national security experience",
  "claimType": "experience",
  "searchQuery": "April McClain Delaney extensive national security experience"
}
```

**Response:**
```json
{
  "success": true,
  "claim": "extensive national security experience",
  "results": [
    {
      "title": "April McClain Delaney - LinkedIn",
      "url": "https://linkedin.com/in/...",
      "snippet": "National security advisor with 15 years experience...",
      "source": "linkedin.com",
      "relevanceScore": 0.95
    }
  ],
  "bestMatch": { ... }
}
```

### GET /api/health

Health check endpoint.

## Claim Types

The API uses different search strategies for different claim types:

| Claim Type | Preferred Sources | Fact-Check Required |
|------------|------------------|---------------------|
| `experience` | LinkedIn, campaign bios, news | No |
| `org_description` | Official .org sites, Wikipedia | No |
| `voting_record` | Congress.gov, VoteSmart.org | No |
| `policy_document` | Politifact, FactCheck.org, .gov | Yes |
| `policy_claim` | CBO, .gov/.edu analysis | Yes |
| `factual_claim` | Fact-checking sites | Yes |
| `statistic` | Census.gov, BLS.gov, Pew Research | No |

## Integration with Press Release Editor

Update the `findEvidence` function in `press_release_editor.html`:

```javascript
async function findEvidence(claimId, searchQuery, claimType) {
  const statusEl = document.getElementById(`evidence-status-${claimId}`);
  const urlInput = document.getElementById(`evidenceUrl-${claimId}`);
  const claimText = document.getElementById(`claimText-${claimId}`).value;

  statusEl.innerHTML = '<span style="color:#ffb86c">🔄 Searching for evidence...</span>';

  try {
    const response = await fetch('http://localhost:3002/api/find-evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        claim: claimText,
        claimType: claimType,
        searchQuery: searchQuery
      })
    });

    const data = await response.json();

    if (data.success && data.bestMatch) {
      urlInput.value = data.bestMatch.url;
      statusEl.innerHTML = `<span style="color:#7dfca5">✓ Found: ${data.bestMatch.source}</span>`;
    } else {
      statusEl.innerHTML = '<span style="color:#ff7b7b">No results found</span>';
    }
  } catch (error) {
    statusEl.innerHTML = `<span style="color:#ff7b7b">Error: ${error.message}</span>`;
  }
}
```

## ChatGPT Integration

When `OPENAI_API_KEY` is set, the Evidence Finder can use ChatGPT to:

1. **Search the web** for relevant sources
2. **Validate claims** against authoritative sources
3. **Rank results** by relevance and reliability
4. **Extract excerpts** for evidence documentation

### Example ChatGPT Response

```json
{
  "url": "https://www.congress.gov/member/...",
  "source": "Congress.gov",
  "reliability": "Official U.S. government congressional record",
  "excerpt": "Voted in favor of H.R. 1234 on March 15, 2024"
}
```

## Extending the Evidence Finder

### Add Custom Search APIs

```javascript
async function searchWithBingAPI(query) {
  const response = await fetch(
    `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.BING_API_KEY
      }
    }
  );
  return response.json();
}
```

### Add Domain Allowlist Validation

```javascript
const allowedDomains = require('./domain_allowlist.json');

function validateSource(url) {
  const domain = new URL(url).hostname.replace('www.', '');
  return allowedDomains.allowed_domains.includes(domain);
}
```

### Add Result Caching

```javascript
const cache = new Map();

function getCachedResults(query) {
  const key = query.toLowerCase().trim();
  if (cache.has(key)) {
    const cached = cache.get(key);
    if (Date.now() - cached.timestamp < 3600000) { // 1 hour
      return cached.results;
    }
  }
  return null;
}
```

## Environment Variables

- `PORT` - API server port (default: 3002)
- `OPENAI_API_KEY` - OpenAI API key for ChatGPT integration (optional)
- `BING_API_KEY` - Bing Search API key (optional)
- `GOOGLE_API_KEY` - Google Custom Search API key (optional)

## Security Notes

- **CORS** is enabled for development - restrict in production
- **API keys** should never be committed to version control
- **Rate limiting** should be added for production use
- **Input validation** and sanitization needed for production

## Future Enhancements

- [ ] Google Custom Search API integration
- [ ] Bing Search API integration
- [ ] DuckDuckGo API integration
- [ ] Automatic fact-checking with multiple sources
- [ ] Confidence scoring for evidence
- [ ] Evidence excerpt extraction
- [ ] Cache layer for repeated searches
- [ ] Rate limiting and authentication
- [ ] Support for multiple languages
- [ ] Integration with domain allowlist validation

## License

MIT
