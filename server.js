const express = require('express');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3001;

// Anti-caching middleware - CRITICAL for Requirement 1.1
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('ETag', '');
    res.setHeader('Last-Modified', '');
    res.setHeader('X-Cache-Bust', new Date().toISOString());
    next();
});

// JSON parsing middleware for POST requests
app.use(express.json());

// Serve static files (for test.html)
app.use(express.static('.'));

// API endpoint for testing backend-frontend communication
app.get('/api/status', (req, res) => {
    const timestamp = new Date().toISOString();
    const unixTime = Date.now();

    const response = {
        success: true,
        timestamp: timestamp,
        unixTime: unixTime,
        readable: new Date().toLocaleString(),
        server: 'Campaign AI Editor - Test Backend',
        requirement: '1.1 - Basic Backend-Frontend Communication',
        cacheTest: Math.random().toString(36).substring(7)
    };

    // Log each request with timestamp for backend testing
    console.log(`[${timestamp}] API Request: /api/status - Response:`, response);

    res.json(response);
});

// Text analysis function
function analyzeText(text) {
    if (!text || typeof text !== 'string') {
        return {
            wordCount: 0,
            sentenceCount: 0,
            characterCount: 0,
            characterCountNoSpaces: 0
        };
    }

    // Character count (with and without spaces)
    const characterCount = text.length;
    const characterCountNoSpaces = text.replace(/\s/g, '').length;

    // Word count (split by whitespace, filter empty strings)
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    // Sentence count (split by sentence endings, filter empty strings)
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const sentenceCount = sentences.length;

    return {
        wordCount,
        sentenceCount,
        characterCount,
        characterCountNoSpaces
    };
}

// Document type detection function - Requirement 2.2
function detectDocumentType(text) {
    if (!text || typeof text !== 'string') {
        return {
            primaryType: 'Unknown',
            primaryConfidence: 0,
            subtype: null,
            subtypeConfidence: 0
        };
    }

    const lowerText = text.toLowerCase();

    // Define keyword patterns for each document type
    const patterns = {
        'Press Release': {
            keywords: ['press release', 'for immediate release', 'contact:', 'announces', '###'],
            weight: 1.0
        },
        'Speech': {
            keywords: ['thank you', 'my fellow', 'ladies and gentlemen', 'today i stand', 'together we'],
            weight: 1.0
        },
        'Policy Statement': {
            keywords: ['policy statement', 'whereas', 'therefore', 'section 1:', 'section 2:', 'section 3:', 'legislation', 'reform', 'shall take effect'],
            weight: 1.0
        },
        'Social Media Post': {
            keywords: ['#', '@', 'follow', 'like', 'share', 'retweet', 'link in bio'],
            weight: 1.0
        },
        'Email Campaign': {
            keywords: ['dear friend', 'unsubscribe', 'donate now', 'contribute', 'forward this', 'election day'],
            weight: 1.0
        }
    };

    // Press release subtype patterns
    const pressReleaseSubtypes = {
        'Candidacy Announcement': {
            keywords: ['announces candidacy', 'announces her candidacy', 'announces his candidacy', 'announces their candidacy', 'running for', 'seeks election', 'campaign for', 'candidate for', 'announces', 'candidacy'],
            weight: 1.0
        },
        'Endorsement Announcement': {
            keywords: ['endorses', 'endorsement', 'supports', 'backing', 'support from', 'endorsed by'],
            weight: 1.0
        },
        'Event Promotion': {
            keywords: ['join us', 'attend', 'event', 'rally', 'town hall', 'meeting', 'forum', 'when:', 'where:'],
            weight: 1.0
        },
        'Policy/Initiative Update': {
            keywords: ['proposes', 'initiative', 'plan', 'legislation', 'policy update', 'announces plan'],
            weight: 1.0
        },
        'Issue-Based Campaign': {
            keywords: ['campaign launches', 'awareness', 'public urged', 'calls for', 'advocates for'],
            weight: 1.0
        },
        'Grant Award': {
            keywords: ['awarded', 'announces', 'million', 'funding', 'grant', 'contract', 'construction', 'project', 'investment', 'federal funding', 'infrastructure'],
            weight: 1.0
        }
    };

    // Calculate scores for primary document types
    const scores = {};
    for (const [type, pattern] of Object.entries(patterns)) {
        let score = 0;
        const totalKeywords = pattern.keywords.length;

        for (const keyword of pattern.keywords) {
            if (lowerText.includes(keyword)) {
                score += pattern.weight;
            }
        }

        scores[type] = (score / totalKeywords) * 100;
    }

    // Find primary type with highest score
    const primaryType = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    const primaryConfidence = Math.round(scores[primaryType]);

    // If it's a press release, detect subtype
    let subtype = null;
    let subtypeConfidence = 0;

    if (primaryType === 'Press Release' && primaryConfidence >= 10) {
        const subtypeScores = {};

        for (const [subtypeName, pattern] of Object.entries(pressReleaseSubtypes)) {
            let score = 0;
            const totalKeywords = pattern.keywords.length;

            for (const keyword of pattern.keywords) {
                if (lowerText.includes(keyword)) {
                    score += pattern.weight;
                }
            }

            subtypeScores[subtypeName] = (score / totalKeywords) * 100;
        }

        const bestSubtype = Object.keys(subtypeScores).reduce((a, b) =>
            subtypeScores[a] > subtypeScores[b] ? a : b);

        if (subtypeScores[bestSubtype] >= 10) { // Lower threshold for subtypes
            subtype = bestSubtype;
            subtypeConfidence = Math.round(subtypeScores[bestSubtype]);
        }
    }

    return {
        primaryType,
        primaryConfidence,
        subtype,
        subtypeConfidence
    };
}

// API endpoint for text analysis - Requirement 2.1
app.post('/api/analyze', (req, res) => {
    const timestamp = new Date().toISOString();
    const { text } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
        const error = {
            success: false,
            error: 'Text content is required',
            timestamp: timestamp,
            requirement: '2.1 - Text Input and Processing'
        };
        console.log(`[${timestamp}] API Request: /api/analyze - Error: Missing text content`);
        return res.status(400).json(error);
    }

    // Perform text analysis
    const analysis = analyzeText(text);

    // Perform document type detection - Requirement 2.2
    const documentType = detectDocumentType(text);

    const response = {
        success: true,
        timestamp: timestamp,
        requirement: '2.1 & 2.2 - Text Analysis and Document Type Detection',
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), // Preview of text
        textLength: text.length,
        analysis: analysis,
        documentType: documentType
    };

    // Log each request with timestamp and analysis results
    console.log(`[${timestamp}] API Request: /api/analyze - Analysis:`, {
        textLength: text.length,
        wordCount: analysis.wordCount,
        sentenceCount: analysis.sentenceCount,
        characterCount: analysis.characterCount,
        documentType: documentType.primaryType,
        confidence: documentType.primaryConfidence,
        subtype: documentType.subtype,
        subtypeConfidence: documentType.subtypeConfidence
    });

    res.json(response);
});

// URL fetching function
function fetchURL(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https:') ? https : http;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        const req = client.get(url, options, (res) => {
            let data = '';

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Enhanced HTML to text extraction with navigation filtering and paragraph preservation
function extractTextFromHTML(html) {
    // Remove script and style elements
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // More targeted navigation removal - be less aggressive
    // Only remove obvious navigation elements, not content areas
    text = text.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '');
    text = text.replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, '');

    // Remove elements with navigation class names but be more specific
    text = text.replace(/<[^>]+(?:class|id)=[^>]*(?:navigation|navbar|menu-main|breadcrumb|skip-link)[^>]*>[\s\S]*?<\/[^>]+>/gi, '');

    // Remove common website chrome patterns
    text = text.replace(/Skip to main content/gi, '');
    text = text.replace(/(?:Home|About|Contact|Issues|Media|Services|Press Releases?|Email Sign Up|Request|Tours?|Tickets?|Offices?)\s*•\s*/gi, '');

    // Remove Issues/Tags sections more comprehensively
    text = text.replace(/Issues?:\s*[\s\S]*?(?=\n\n|\n[A-Z]|\nOffice|$)/gi, '');
    text = text.replace(/Tags?:\s*[\s\S]*?(?=\n\n|\n[A-Z]|\nOffice|$)/gi, '');
    text = text.replace(/Topics?:\s*[\s\S]*?(?=\n\n|\n[A-Z]|\nOffice|$)/gi, '');

    // Remove specific issue category labels with better patterns
    text = text.replace(/Issues?:\s*(?:Environment|Economy|Health\s*Care|Education|Defense|Immigration|Technology|Foreign\s*Policy|Gun\s*Violence|Voting\s*Rights|Energy|Innovation|Growing\s*a\s*Strong\s*Economy|Homeland\s*Security)+\s*/gi, '');
    text = text.replace(/(?:Environment|Economy|Health\s*Care|Education|Defense|Immigration|Technology|Foreign\s*Policy|Gun\s*Violence|Voting\s*Rights|Energy|Innovation|Growing\s*a\s*Strong\s*Economy|Homeland\s*Security)(?=\s*(?:Environment|Economy|Health\s*Care|Education|Defense|Immigration|Technology|Foreign\s*Policy|Gun\s*Violence|Voting\s*Rights|Energy|Innovation|Growing\s*a\s*Strong\s*Economy|Homeland\s*Security))/gi, '');

    // Remove "Image" text from image placeholders
    text = text.replace(/\bImage\b/gi, '');

    // Remove office addresses and contact information blocks
    text = text.replace(/(?:Washington|District)\s+(?:DC\s+)?Office[\s\S]*?(?:Phone:|Fax:)[\s\S]*?(?:\d{3}[-.)]\s*\d{3}[-.)]\s*\d{4})/gi, '');
    text = text.replace(/\d+\s+\w+[\w\s]+(?:Street|Ave|Avenue|Blvd|Boulevard|Road|Dr|Drive)[\s\S]*?(?:Phone:|Fax:)[\s\S]*?(?:\d{3}[-.)]\s*\d{3}[-.)]\s*\d{4})/gi, '');

    // Remove common footer links and copyright
    text = text.replace(/(?:Copyright|Privacy|House\.gov|Accessibility|RSS|¡Bienvenidos!|Xin Chào)\s*•?\s*/gi, '');

    // Remove coordinate/map data
    text = text.replace(/\d+\.\d+[\s,-]+\d+\.\d+/g, '');

    // Remove district codes like "CA18"
    text = text.replace(/\b[A-Z]{2}\d+\b/g, '');

    // Convert block-level elements to paragraphs with double newlines
    text = text.replace(/<\/?(p|div|h[1-6]|section|article|main)\b[^>]*>/gi, '\n\n');

    // Add extra spacing around sentences that end with periods, quotes, or other ending punctuation
    text = text.replace(/([.!?]"?)\s*\n/g, '$1\n\n');

    // Convert line breaks to single newlines
    text = text.replace(/<br\s*\/?>/gi, '\n');

    // Convert list items to lines with bullet points
    text = text.replace(/<li\b[^>]*>/gi, '\n• ');
    text = text.replace(/<\/li>/gi, '');

    // Remove remaining HTML tags
    text = text.replace(/<[^>]*>/g, '');

    // Decode common HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");

    // Clean up whitespace while preserving paragraph structure
    text = text.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
    text = text.replace(/\n[ \t]+/g, '\n'); // Remove spaces at start of lines
    text = text.replace(/[ \t]+\n/g, '\n'); // Remove spaces at end of lines
    text = text.replace(/\n{4,}/g, '\n\n\n'); // Limit excessive newlines but keep paragraph breaks
    text = text.replace(/\n{3}/g, '\n\n'); // Normalize triple newlines to double

    // Remove bullet points that are alone on lines (from navigation cleanup)
    text = text.replace(/\n•\s*\n/g, '\n');

    // Remove footer and office information sections
    text = text.replace(/\nOffice Locations[\s\S]*$/gi, '');

    // Remove final Issues sections that appear at the end
    text = text.replace(/\nIssues:\s*[\s\S]*$/gi, '');

    // Be less aggressive with line filtering - preserve paragraph structure
    text = text.split('\n').filter(line => {
        const trimmed = line.trim();
        // Keep empty lines for paragraph breaks
        if (trimmed.length === 0) return true;
        // Skip very short non-empty lines
        if (trimmed.length < 2) return false;
        // Skip lone bullets
        if (/^•\s*$/.test(trimmed)) return false;
        // Skip obvious nav words only
        if (/^(Home|About|Contact|Issues|Media|Services)$/i.test(trimmed)) return false;
        return true;
    }).join('\n');

    text = text.trim();

    return text;
}

// API endpoint for fetching URL content
app.post('/api/fetch-url', async (req, res) => {
    const timestamp = new Date().toISOString();
    const { url } = req.body;

    // Validate input
    if (!url || typeof url !== 'string') {
        const error = {
            success: false,
            error: 'URL is required',
            timestamp: timestamp
        };
        console.log(`[${timestamp}] API Request: /api/fetch-url - Error: Missing URL`);
        return res.status(400).json(error);
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (err) {
        const error = {
            success: false,
            error: 'Invalid URL format',
            timestamp: timestamp
        };
        console.log(`[${timestamp}] API Request: /api/fetch-url - Error: Invalid URL format`);
        return res.status(400).json(error);
    }

    try {
        console.log(`[${timestamp}] Fetching URL: ${url}`);

        const response = await fetchURL(url);

        if (response.statusCode !== 200) {
            const error = {
                success: false,
                error: `HTTP ${response.statusCode}`,
                timestamp: timestamp,
                url: url
            };
            console.log(`[${timestamp}] URL fetch failed: HTTP ${response.statusCode}`);
            return res.status(400).json(error);
        }

        // Extract text content from HTML
        const textContent = extractTextFromHTML(response.body);

        if (textContent.length < 50) {
            const error = {
                success: false,
                error: 'Insufficient content extracted from URL',
                timestamp: timestamp,
                url: url,
                contentLength: textContent.length
            };
            console.log(`[${timestamp}] URL fetch warning: Low content length (${textContent.length} chars)`);
            return res.status(400).json(error);
        }

        const result = {
            success: true,
            timestamp: timestamp,
            url: url,
            text: textContent,
            textLength: textContent.length,
            contentType: response.headers['content-type'] || 'unknown'
        };

        console.log(`[${timestamp}] URL fetch successful: ${url} (${textContent.length} chars)`);
        res.json(result);

    } catch (error) {
        console.error(`[${timestamp}] URL fetch error:`, error);

        const errorResponse = {
            success: false,
            error: error.message || 'Failed to fetch URL',
            timestamp: timestamp,
            url: url
        };

        res.status(500).json(errorResponse);
    }
});

// Training Data Knowledge Base Storage
const fs = require('fs').promises;

const TRAINING_DATA_FILE = path.join(__dirname, 'training-data.json');

// Load existing training data
async function loadTrainingData() {
    try {
        const data = await fs.readFile(TRAINING_DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // File doesn't exist or is invalid, return empty structure
        return {
            entries: [],
            metadata: {
                totalEntries: 0,
                lastUpdated: new Date().toISOString(),
                version: '1.0'
            }
        };
    }
}

// Save training data
async function saveTrainingData(trainingData) {
    trainingData.metadata.lastUpdated = new Date().toISOString();
    trainingData.metadata.totalEntries = trainingData.entries.length;
    await fs.writeFile(TRAINING_DATA_FILE, JSON.stringify(trainingData, null, 2));
}

// POST /api/training-data - Save new training entry
app.post('/api/training-data', async (req, res) => {
    const timestamp = new Date().toISOString();

    try {
        const trainingEntry = req.body;

        if (!trainingEntry || (!trainingEntry.originalClassification && !trainingEntry.correctedClassification)) {
            const error = {
                success: false,
                error: 'Invalid training entry data - missing classification data',
                timestamp: timestamp
            };
            console.log(`[${timestamp}] API Request: /api/training-data - Error: Invalid data`);
            return res.status(400).json(error);
        }

        // Load existing data
        const trainingData = await loadTrainingData();

        // Add server-side metadata
        const enhancedEntry = {
            ...trainingEntry,
            serverId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            serverTimestamp: timestamp,
            sessionId: req.headers['x-session-id'] || 'unknown'
        };

        // Add to entries
        trainingData.entries.push(enhancedEntry);

        // Save back to file
        await saveTrainingData(trainingData);

        const entryType = enhancedEntry.correctionType === 'manual_correction' ? 'Manual Correction' : 'Confirmed Correct';
        console.log(`[${timestamp}] Training entry saved: ${entryType} (Total entries: ${trainingData.entries.length})`);

        res.json({
            success: true,
            entryId: enhancedEntry.serverId,
            totalEntries: trainingData.entries.length,
            timestamp: timestamp
        });

    } catch (error) {
        console.error(`[${timestamp}] Training data save error:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to save training data',
            timestamp: timestamp
        });
    }
});

// GET /api/training-data - Retrieve training history and analytics
app.get('/api/training-data', async (req, res) => {
    const timestamp = new Date().toISOString();

    try {
        const trainingData = await loadTrainingData();

        // Calculate analytics
        const analytics = {
            totalEntries: trainingData.entries.length,
            manualCorrections: trainingData.entries.filter(e => e.correctionType === 'manual_correction').length,
            confirmedCorrect: trainingData.entries.filter(e => e.correctionType === 'confirmed_correct').length,
            correctionRate: trainingData.entries.length > 0 ?
                Math.round((trainingData.entries.filter(e => e.correctionType === 'manual_correction').length / trainingData.entries.length) * 100) : 0,

            // Content type distribution
            contentTypeDistribution: {},

            // Recent activity (last 7 days)
            recentEntries: trainingData.entries.filter(e => {
                const entryDate = new Date(e.timestamp);
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return entryDate > weekAgo;
            }).length
        };

        // Calculate content type distribution
        trainingData.entries.forEach(entry => {
            const contentFormat = entry.originalClassification?.contentFormat || 'Unknown';
            analytics.contentTypeDistribution[contentFormat] =
                (analytics.contentTypeDistribution[contentFormat] || 0) + 1;
        });

        console.log(`[${timestamp}] Training data retrieved: ${analytics.totalEntries} entries, ${analytics.correctionRate}% correction rate`);

        res.json({
            success: true,
            data: trainingData,
            analytics: analytics,
            timestamp: timestamp
        });

    } catch (error) {
        console.error(`[${timestamp}] Training data retrieval error:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve training data',
            timestamp: timestamp
        });
    }
});

// GET /api/training-analytics - Get knowledge base insights
app.get('/api/training-analytics', async (req, res) => {
    const timestamp = new Date().toISOString();

    try {
        const trainingData = await loadTrainingData();

        // Advanced analytics for knowledge base insights
        const analytics = {
            totalEntries: trainingData.entries.length,
            manualCorrections: trainingData.entries.filter(e => e.correctionType === 'manual_correction').length,
            confirmedCorrect: trainingData.entries.filter(e => e.correctionType === 'confirmed_correct').length,
            uniqueSessions: [...new Set(trainingData.entries.map(e => e.sessionId))].length,

            // Date range
            dateRange: trainingData.entries.length > 0 ? {
                oldest: new Date(Math.min(...trainingData.entries.map(e => new Date(e.timestamp)))).toLocaleDateString(),
                newest: new Date(Math.max(...trainingData.entries.map(e => new Date(e.timestamp)))).toLocaleDateString()
            } : null,

            // Content type analysis
            contentTypeAccuracy: {},

            // Common correction patterns
            correctionPatterns: {},

            // Recent activity (last 7 days)
            recentActivity: trainingData.entries.filter(e => {
                const entryDate = new Date(e.timestamp);
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return entryDate > weekAgo;
            }).length
        };

        // Calculate content type accuracy
        const contentTypes = {};
        trainingData.entries.forEach(entry => {
            const originalFormat = entry.originalClassification?.contentFormat || 'Unknown';
            const correctedFormat = entry.correctedClassification?.contentFormat || originalFormat;

            if (!contentTypes[originalFormat]) {
                contentTypes[originalFormat] = { total: 0, correct: 0 };
            }
            contentTypes[originalFormat].total++;

            // If it's confirmed correct OR the formats match, count as correct
            if (entry.correctionType === 'confirmed_correct' || originalFormat === correctedFormat) {
                contentTypes[originalFormat].correct++;
            }
        });

        Object.keys(contentTypes).forEach(type => {
            analytics.contentTypeAccuracy[type] = {
                accuracy: Math.round((contentTypes[type].correct / contentTypes[type].total) * 100),
                correct: contentTypes[type].correct,
                total: contentTypes[type].total
            };
        });

        // Analyze correction patterns
        trainingData.entries.forEach(entry => {
            if (entry.correctionType === 'manual_correction') {
                const pattern = `${entry.originalClassification?.messageTheme || 'Unknown'} → ${entry.correctedClassification?.messageTheme || 'Unknown'}`;
                analytics.correctionPatterns[pattern] = (analytics.correctionPatterns[pattern] || 0) + 1;
            }
        });

        console.log(`[${timestamp}] Training analytics generated: ${Object.keys(analytics.contentTypeAccuracy).length} content types analyzed`);

        res.json({
            success: true,
            analytics: analytics,
            timestamp: timestamp,
            dataPoints: trainingData.entries.length
        });

    } catch (error) {
        console.error(`[${timestamp}] Training analytics error:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate analytics',
            timestamp: timestamp
        });
    }
});

// Decision tree classification endpoint
app.post('/api/decision-tree-classification', (req, res) => {
    try {
        const { url, text, timestamp, primary_label_id, classification_path, secondary_attributes } = req.body;

        if (!text || !primary_label_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: text, primary_label_id'
            });
        }

        // Validate classification_path
        if (!classification_path || !Array.isArray(classification_path)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid classification_path - must be an array'
            });
        }

        // Create training entry with decision tree structure
        const trainingEntry = {
            id: Date.now(),
            url,
            text: text.substring(0, 500) + (text.length > 500 ? '...' : ''), // Store truncated text
            fullText: text,
            timestamp: timestamp || new Date().toISOString(),
            primary_label_id,
            classification_path,
            secondary_attributes: secondary_attributes || {},
            entry_type: 'decision_tree',
            schema_version: '1.0.0'
        };

        // Load existing training data
        const fs = require('fs');
        let trainingData = [];

        const trainingFilePath = 'decision_tree_training_data.json';

        try {
            if (fs.existsSync(trainingFilePath)) {
                const existingData = fs.readFileSync(trainingFilePath, 'utf8');
                trainingData = JSON.parse(existingData);
            }
        } catch (err) {
            console.log('Creating new training data file');
        }

        // Add new entry
        trainingData.push(trainingEntry);

        // Save updated training data
        fs.writeFileSync(trainingFilePath, JSON.stringify(trainingData, null, 2));

        console.log(`Decision tree classification saved: ${primary_label_id} for ${url}`);

        res.json({
            success: true,
            entryId: trainingEntry.id,
            totalEntries: trainingData.length,
            primary_label_id,
            message: 'Classification saved successfully'
        });

    } catch (error) {
        console.error('Error saving decision tree classification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save classification: ' + error.message
        });
    }
});

// Import existing training data endpoint
app.post('/api/import-training-data', (req, res) => {
    try {
        const fs = require('fs');

        // Load training data from the provided JSON file
        const trainingDataPath = 'press_release_training_data-2.json';

        if (!fs.existsSync(trainingDataPath)) {
            return res.status(404).json({
                success: false,
                error: 'Training data file not found'
            });
        }

        const existingTrainingData = JSON.parse(fs.readFileSync(trainingDataPath, 'utf8'));

        // Transform to decision tree format
        const transformedData = existingTrainingData.map(entry => ({
            id: entry.id || Date.now() + Math.random(),
            url: entry.url || null,
            text: entry.text,
            fullText: entry.fullText || entry.text,
            timestamp: entry.timestamp,
            // Map old format to decision tree format
            original_classification: {
                primaryType: entry.correctLabel?.primaryType,
                subtype: entry.correctLabel?.subtype,
                subSubtype: entry.correctLabel?.subSubtype,
                confidence: entry.correctLabel?.confidence
            },
            ai_prediction: entry.aiPrediction,
            ai_was_correct: entry.aiWasCorrect,
            entry_type: 'imported_legacy',
            schema_version: '1.0.0'
        }));

        // Save transformed data
        const outputPath = 'imported_training_data.json';
        fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2));

        console.log(`Imported ${transformedData.length} training entries`);

        res.json({
            success: true,
            imported_count: transformedData.length,
            output_file: outputPath,
            message: 'Training data imported successfully'
        });

    } catch (error) {
        console.error('Error importing training data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to import training data: ' + error.message
        });
    }
});

// Get decision tree training data
app.get('/api/decision-tree-training-data', (req, res) => {
    try {
        const fs = require('fs');
        const trainingFilePath = 'decision_tree_training_data.json';

        let trainingData = [];
        if (fs.existsSync(trainingFilePath)) {
            const data = fs.readFileSync(trainingFilePath, 'utf8');
            trainingData = JSON.parse(data);
        }

        // Calculate analytics
        const analytics = {
            total_entries: trainingData.length,
            label_distribution: {},
            recent_entries: trainingData.slice(-10).map(entry => ({
                id: entry.id,
                primary_label_id: entry.primary_label_id,
                timestamp: entry.timestamp,
                url: entry.url
            }))
        };

        // Count label distribution
        trainingData.forEach(entry => {
            const label = entry.primary_label_id;
            analytics.label_distribution[label] = (analytics.label_distribution[label] || 0) + 1;
        });

        res.json({
            success: true,
            training_data: trainingData,
            analytics
        });

    } catch (error) {
        console.error('Error retrieving training data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve training data: ' + error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Campaign AI Editor Backend'
    });
});

// CPO Integration API Endpoints
app.post('/api/initialize-cpo', (req, res) => {
    try {
        const fs = require('fs');

        // Create basic CPO document templates
        const cpoTemplates = {
            'press_release_template.json': {
                title: '',
                subtitle: '',
                date: '',
                location: '',
                content: {
                    headline: '',
                    body: '',
                    quote: '',
                    attribution: ''
                },
                contacts: {
                    press: '',
                    campaign: ''
                },
                metadata: {
                    tags: [],
                    category: '',
                    priority: 'normal'
                }
            },
            'statement_template.json': {
                title: '',
                author: '',
                date: '',
                statement: '',
                context: '',
                metadata: {
                    type: 'statement',
                    issue_area: '',
                    tone: 'neutral'
                }
            }
        };

        // Save templates to CPO directory
        Object.entries(cpoTemplates).forEach(([filename, template]) => {
            const templatePath = path.join(__dirname, 'cpo', 'templates', filename);
            fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
        });

        // Create basic schema files
        const schemas = {
            'press_release_schema.json': {
                type: 'object',
                required: ['title', 'date', 'content'],
                properties: {
                    title: { type: 'string', minLength: 10 },
                    subtitle: { type: 'string' },
                    date: { type: 'string', format: 'date' },
                    location: { type: 'string' },
                    content: {
                        type: 'object',
                        required: ['headline', 'body'],
                        properties: {
                            headline: { type: 'string', minLength: 20 },
                            body: { type: 'string', minLength: 100 },
                            quote: { type: 'string' },
                            attribution: { type: 'string' }
                        }
                    }
                }
            }
        };

        Object.entries(schemas).forEach(([filename, schema]) => {
            const schemaPath = path.join(__dirname, 'cpo', 'schemas', filename);
            fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
        });

        res.json({
            success: true,
            message: 'CPO framework initialized',
            templates_created: Object.keys(cpoTemplates).length,
            schemas_created: Object.keys(schemas).length,
            timestamp: new Date().toISOString()
        });

        console.log('✅ CPO framework initialized with templates and schemas');

    } catch (error) {
        console.error('❌ CPO initialization error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get CPO documents
app.get('/api/cpo/documents', (req, res) => {
    try {
        const fs = require('fs');
        const os = require('os');
        const cpoPath = path.join(__dirname, 'cpo');
        const documentsSourcePath = path.join(os.homedir(), 'Downloads', 'Model for editing new content with AIO');

        const documents = {
            templates: [],
            schemas: [],
            examples: [],
            docs: [],
            tools: [],
            training: []
        };

        // Function to scan directory recursively and categorize files
        function scanDirectory(dirPath, category) {
            if (!fs.existsSync(dirPath)) return [];

            const items = [];
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    // Recursively scan subdirectories
                    items.push(...scanDirectory(fullPath, category));
                } else if (entry.isFile() && !entry.name.startsWith('.')) {
                    // Add file info
                    const stats = fs.statSync(fullPath);
                    items.push({
                        name: entry.name,
                        path: fullPath,
                        relativePath: path.relative(documentsSourcePath, fullPath),
                        modified: stats.mtime,
                        size: stats.size
                    });
                }
            }

            return items;
        }

        // Scan local CPO directory - subdirectories
        ['templates', 'schemas', 'examples', 'docs', 'tools', 'training'].forEach(dir => {
            const dirPath = path.join(cpoPath, dir);
            if (fs.existsSync(dirPath)) {
                const files = scanDirectory(dirPath, dir);

                // Special handling for docs directory - separate tools
                if (dir === 'docs') {
                    files.forEach(file => {
                        const fileName = file.name.toLowerCase();
                        // Interactive tools (HTML files with editor/viewer or tools index) go to tools category
                        if (fileName.endsWith('.html') && (fileName.includes('editor') || fileName.includes('viewer') || fileName === 'index.html')) {
                            documents.tools.push(file);
                        } else {
                            documents.docs.push(file);
                        }
                    });
                } else {
                    documents[dir] = files;
                }
            }
        });

        // Scan root-level cpo_templates/ and cpo_examples/ directories
        const rootTemplatesPath = path.join(__dirname, 'cpo_templates');
        const rootExamplesPath = path.join(__dirname, 'cpo_examples');

        if (fs.existsSync(rootTemplatesPath)) {
            const templateFiles = scanDirectory(rootTemplatesPath, 'templates');
            documents.templates.push(...templateFiles);
        }

        if (fs.existsSync(rootExamplesPath)) {
            const exampleFiles = scanDirectory(rootExamplesPath, 'examples');
            documents.examples.push(...exampleFiles);
        }

        // Scan root-level files in cpo/ directory
        if (fs.existsSync(cpoPath)) {
            const rootFiles = fs.readdirSync(cpoPath, { withFileTypes: true })
                .filter(entry => entry.isFile() && !entry.name.startsWith('.'))
                .map(entry => {
                    const fullPath = path.join(cpoPath, entry.name);
                    const stats = fs.statSync(fullPath);
                    return {
                        name: entry.name,
                        path: fullPath,
                        relativePath: path.relative(cpoPath, fullPath),
                        modified: stats.mtime,
                        size: stats.size
                    };
                });

            // Categorize root-level files
            rootFiles.forEach(file => {
                const fileName = file.name.toLowerCase();

                if (fileName.includes('template') && fileName.endsWith('.json')) {
                    documents.templates.push(file);
                } else if (fileName.includes('schema') || fileName.includes('context') || fileName.includes('shacl') || fileName.includes('validate')) {
                    documents.schemas.push(file);
                } else if (fileName.includes('release') && fileName.endsWith('.jsonld')) {
                    documents.examples.push(file);
                } else if (fileName.endsWith('.md') || fileName.endsWith('.py') || fileName.endsWith('.txt')) {
                    documents.docs.push(file);
                } else if (fileName.endsWith('.json') || fileName.endsWith('.jsonld') || fileName.endsWith('.yml') || fileName.endsWith('.yaml') || fileName.endsWith('.ttl')) {
                    documents.schemas.push(file);
                }
            });
        }

        // Scan Downloads folder for additional documents
        if (fs.existsSync(documentsSourcePath)) {
            // Categorize files from Downloads based on filename and extension
            const allFiles = scanDirectory(documentsSourcePath, 'external');

            allFiles.forEach(file => {
                const fileName = file.name.toLowerCase();

                if (fileName.includes('template') && fileName.endsWith('.json')) {
                    documents.templates.push(file);
                } else if (fileName.includes('schema') && (fileName.endsWith('.json') || fileName.endsWith('.jsonld') || fileName.endsWith('.ttl'))) {
                    documents.schemas.push(file);
                } else if (fileName.includes('example') || fileName.includes('release')) {
                    documents.examples.push(file);
                } else if (fileName.endsWith('.md') || fileName.endsWith('.html') || fileName.endsWith('.py') || fileName.endsWith('.css')) {
                    documents.docs.push(file);
                } else if (fileName.endsWith('.json') || fileName.endsWith('.jsonld') || fileName.endsWith('.ttl') || fileName.endsWith('.yml') || fileName.endsWith('.yaml')) {
                    // Generic structured data files go to schemas
                    documents.schemas.push(file);
                }
            });
        }

        console.log('📁 Loaded CPO documents:', {
            templates: documents.templates.length,
            schemas: documents.schemas.length,
            examples: documents.examples.length,
            docs: documents.docs.length
        });

        res.json({
            success: true,
            documents,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ CPO documents error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API endpoint to read and serve individual CPO files
app.get('/api/cpo/file', (req, res) => {
    try {
        const fs = require('fs');
        const filePath = req.query.path;

        if (!filePath) {
            return res.status(400).json({
                success: false,
                error: 'File path is required'
            });
        }

        // Security check: ensure the file exists and is readable
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Read file content
        const content = fs.readFileSync(filePath, 'utf8');

        // If download parameter is set, force download
        if (req.query.download === 'true') {
            const fileName = path.basename(filePath);
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        }

        // Set content type based on file extension
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
            '.json': 'application/json',
            '.jsonld': 'application/ld+json',
            '.md': 'text/markdown',
            '.html': 'text/html',
            '.py': 'text/x-python',
            '.yml': 'text/yaml',
            '.yaml': 'text/yaml',
            '.ttl': 'text/turtle',
            '.css': 'text/css'
        };

        res.setHeader('Content-Type', contentTypes[ext] || 'text/plain');
        res.send(content);

    } catch (error) {
        console.error('❌ File read error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API endpoint to get training data statistics and samples
app.get('/api/training-data/stats', (req, res) => {
    try {
        const fs = require('fs');
        const csvPath = path.join(__dirname, 'cpo', 'training', 'press_release_training_dataset.csv');

        if (!fs.existsSync(csvPath)) {
            return res.status(404).json({
                success: false,
                error: 'Training dataset not found'
            });
        }

        // Read CSV file
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');
        const dataRows = lines.slice(1);

        // Parse and analyze data
        const stats = {
            totalSamples: dataRows.length,
            byScore: {},
            bySubtype: {},
            byScoreAndSubtype: {},
            scoreDistribution: []
        };

        dataRows.forEach(line => {
            const match = line.match(/^([^,]+),([^,]+),(\d+),/);
            if (match) {
                const [, docId, labelId, score] = match;

                // Count by score
                stats.byScore[score] = (stats.byScore[score] || 0) + 1;

                // Count by subtype
                stats.bySubtype[labelId] = (stats.bySubtype[labelId] || 0) + 1;

                // Count by score and subtype
                const key = `${labelId}-${score}`;
                stats.byScoreAndSubtype[key] = (stats.byScoreAndSubtype[key] || 0) + 1;
            }
        });

        // Calculate distribution
        for (let i = 1; i <= 5; i++) {
            stats.scoreDistribution.push({
                score: i,
                count: stats.byScore[i] || 0,
                percentage: ((stats.byScore[i] || 0) / stats.totalSamples * 100).toFixed(1)
            });
        }

        // Get sample records
        const samples = dataRows.slice(0, 5).map(line => {
            const match = line.match(/^([^,]+),([^,]+),(\d+),"([^"]+)","([^"]+)"$/);
            if (match) {
                const [, docId, labelId, score, sampleText, notes] = match;
                return { docId, labelId, score: parseInt(score), sampleText: sampleText.substring(0, 150) + '...', notes };
            }
            return null;
        }).filter(Boolean);

        res.json({
            success: true,
            stats,
            samples,
            subtypes: Object.keys(stats.bySubtype).sort(),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Training data stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API endpoint for adversarial dataset statistics
app.get('/api/adversarial-data/stats', (req, res) => {
    try {
        const fs = require('fs');
        const csvPath = path.join(__dirname, 'cpo', 'training', 'adversarial_mismatch_dataset.csv');

        if (!fs.existsSync(csvPath)) {
            return res.status(404).json({
                success: false,
                error: 'Adversarial dataset not found'
            });
        }

        // Read and parse CSV
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        const dataRows = lines.slice(1);

        const stats = {
            totalCases: dataRows.length,
            byScenario: {},
            bySubtype: {},
            byViolationType: {},
            scenarios: []
        };

        dataRows.forEach(line => {
            const match = line.match(/^([^,]+),([^,]+),([^,]+),/);
            if (match) {
                const [, docId, labelId, scenarioTag] = match;

                stats.byScenario[scenarioTag] = (stats.byScenario[scenarioTag] || 0) + 1;
                stats.bySubtype[labelId] = (stats.bySubtype[labelId] || 0) + 1;
            }
        });

        // Get unique scenarios
        stats.scenarios = Object.keys(stats.byScenario).sort();

        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Adversarial data stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    const startTime = new Date().toISOString();
    console.log(`🚀 Campaign AI Editor Backend started at ${startTime}`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🧪 Test page: http://localhost:${PORT}/test.html`);
    console.log(`📊 API endpoint: http://localhost:${PORT}/api/status`);
    console.log(`✅ Requirement 1.1: Basic Backend-Frontend Communication`);
    console.log(`🕐 Timestamps will be visible in all responses`);
});