# AI Overview Feature - Complete Implementation Guide

**Feature:** Google-style AI-generated summaries above search results
**Model:** Phi-3 Mini (3.8B) - Microsoft's efficient small LLM
**Estimated Time:** 8-12 hours
**Prerequisites:** Digital Ocean GPU with 8GB+ VRAM, Node.js 18+

---

## 📋 Overview

This feature adds an AI-generated summary card that appears above search results, similar to Google's AI Overview. It uses Retrieval Augmented Generation (RAG) to create concise, thematic summaries of your work based on the search query.

### How It Works:
1. User searches for "digital identity"
2. Semantic search finds top 3 relevant works
3. Works + query sent to Phi-3 Mini
4. Model generates 2-3 sentence overview in your style
5. Overview displayed in card above results
6. Response cached for 1 hour

---

## 🚀 Step-by-Step Implementation

### Step 1: Install Dependencies

```bash
cd guccione-browser-search
npm install @xenova/transformers
npm install node-cache
```

**Optional (for better performance):**
```bash
npm install onnxruntime-node
```

---

### Step 2: Download Phi-3 Mini Model

Create `scripts/download-phi3-model.js`:

```javascript
const { AutoTokenizer, AutoModelForCausalLM } = require('@xenova/transformers');
const path = require('path');

async function downloadPhi3() {
  console.log('Downloading Phi-3 Mini model...');
  console.log('This will take 5-10 minutes and download ~7GB');

  const modelId = 'microsoft/Phi-3-mini-4k-instruct';
  const modelPath = path.join(__dirname, '../models/huggingface/phi3');

  try {
    // Download tokenizer
    console.log('\n[1/2] Downloading tokenizer...');
    const tokenizer = await AutoTokenizer.from_pretrained(modelId, {
      cache_dir: modelPath
    });
    console.log('✓ Tokenizer ready');

    // Download model
    console.log('\n[2/2] Downloading model (~7GB)...');
    const model = await AutoModelForCausalLM.from_pretrained(modelId, {
      cache_dir: modelPath,
      quantized: true,  // Use quantized version for speed
      device: 'cuda'    // Use GPU
    });
    console.log('✓ Model ready');

    console.log('\n✅ Phi-3 Mini downloaded successfully!');
    console.log('Model location:', modelPath);

  } catch (error) {
    console.error('❌ Error downloading model:', error);
    process.exit(1);
  }
}

downloadPhi3();
```

Run it:
```bash
node scripts/download-phi3-model.js
```

---

### Step 3: Create AI Overview Service

Create `server/ai-overview.js`:

```javascript
const { pipeline } = require('@xenova/transformers');
const NodeCache = require('node-cache');

// Cache responses for 1 hour
const overviewCache = new NodeCache({ stdTTL: 3600 });

let generator = null;
let isInitialized = false;

/**
 * Initialize the Phi-3 Mini model
 */
async function initialize() {
  if (isInitialized) {
    console.log('AI Overview model already initialized');
    return true;
  }

  try {
    console.log('Initializing Phi-3 Mini for AI Overview...');

    generator = await pipeline(
      'text-generation',
      'microsoft/Phi-3-mini-4k-instruct',
      {
        device: 'cuda',      // Use GPU
        quantized: true,     // Faster inference
        cache_dir: './models/huggingface/phi3'
      }
    );

    isInitialized = true;
    console.log('✓ AI Overview model ready');
    return true;

  } catch (error) {
    console.error('Failed to initialize AI Overview model:', error);
    return false;
  }
}

/**
 * Build prompt in your writing style
 */
function buildPrompt(query, works) {
  const worksContext = works.map((work, i) =>
    `${i + 1}. "${work.title}" (${work.year})
   Medium: ${Array.isArray(work.medium) ? work.medium.join(', ') : work.medium}
   ${work.description}`
  ).join('\n\n');

  return `<|system|>
You are an art curator writing about Fabrizio Guccione's creative technology portfolio.

Style guidelines:
- Write 2-3 concise sentences maximum
- Focus on conceptual themes and ideas, not technical details
- Use poetic but clear language
- Connect works thematically to the search query
- Mention medium/technology only when it adds context
- Write in present tense

Example good overview:
"These works explore digital identity through algorithmic processes and generative systems. Each piece questions how technology shapes our sense of self, using data as both medium and message to create portraits of our algorithmic existence."
<|end|>

<|user|>
Search query: "${query}"

Relevant works:
${worksContext}

Generate a brief, insightful overview connecting these works to the query. Remember: 2-3 sentences max, focus on concepts, be poetic but clear.
<|end|>

<|assistant|>`;
}

/**
 * Generate AI overview for search results
 */
async function generateOverview(query, works) {
  if (!isInitialized) {
    throw new Error('AI Overview model not initialized');
  }

  // Check cache first
  const cacheKey = `${query}_${works.map(w => w.id).join('_')}`;
  const cached = overviewCache.get(cacheKey);
  if (cached) {
    console.log(`Cache hit for query: "${query}"`);
    return { overview: cached, cached: true };
  }

  try {
    console.log(`Generating AI overview for: "${query}"`);
    const startTime = Date.now();

    // Build prompt with context
    const prompt = buildPrompt(query, works.slice(0, 3)); // Top 3 works

    // Generate response
    const response = await generator(prompt, {
      max_new_tokens: 150,        // ~2-3 sentences
      temperature: 0.7,            // Balanced creativity
      top_p: 0.9,                  // Nucleus sampling
      do_sample: true,             // Enable sampling
      repetition_penalty: 1.1      // Avoid repetition
    });

    // Extract generated text (remove prompt)
    let overview = response[0].generated_text
      .replace(prompt, '')
      .trim();

    // Clean up any artifacts
    overview = overview
      .replace(/<\|.*?\|>/g, '')  // Remove special tokens
      .replace(/\n+/g, ' ')        // Single line
      .trim();

    const duration = Date.now() - startTime;
    console.log(`✓ Generated in ${duration}ms`);

    // Cache the response
    overviewCache.set(cacheKey, overview);

    return { overview, cached: false };

  } catch (error) {
    console.error('Error generating overview:', error);
    throw error;
  }
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    keys: overviewCache.keys().length,
    hits: overviewCache.getStats().hits,
    misses: overviewCache.getStats().misses
  };
}

module.exports = {
  initialize,
  generateOverview,
  getCacheStats
};
```

---

### Step 4: Update Server

Update `server/server.js`:

```javascript
// Add at the top with other requires
const aiOverview = require('./ai-overview');

// Initialize with other models (around line 142)
Promise.all([
  imageSearch.initialize(),
  textEmbeddings.initialize(),
  aiOverview.initialize()  // ADD THIS
])
.then(([imageSuccess, textSuccess, aiSuccess]) => {
  modelLoaded = imageSuccess;
  textModelLoaded = textSuccess;
  aiOverviewLoaded = aiSuccess;  // Track status

  console.log('Models initialization completed:',
              'CLIP:', imageSuccess,
              'Text embeddings:', textSuccess,
              'AI Overview:', aiSuccess);

  if (textSuccess) {
    textEmbeddings.initializeWithDefaultSearches();
  }
})
.catch(error => {
  console.error('Error initializing models:', error);
});

// Add new endpoint (around line 344, after /api/search)
app.post('/api/ai-overview', async (req, res) => {
  try {
    const { query, works } = req.body;

    if (!query || !works || works.length === 0) {
      return res.status(400).json({
        error: 'Query and works are required'
      });
    }

    // Check if AI model is loaded
    if (!aiOverviewLoaded) {
      return res.status(503).json({
        error: 'AI Overview service not available'
      });
    }

    // Generate overview
    const result = await aiOverview.generateOverview(query, works);

    res.json({
      overview: result.overview,
      cached: result.cached,
      worksCount: works.length
    });

  } catch (error) {
    console.error('AI Overview error:', error);
    res.status(500).json({
      error: 'Failed to generate overview',
      message: error.message
    });
  }
});

// Update health check endpoint (around line 425)
app.get('/health', (req, res) => {
  const aiStats = aiOverview.getCacheStats();

  res.json({
    status: 'ok',
    modelLoaded: modelLoaded,
    textModelLoaded: textModelLoaded,
    aiOverviewLoaded: aiOverviewLoaded,  // ADD THIS
    imageDataLoaded: mergedData.length > 0,
    worksDataLoaded: worksData.length > 0,
    totalWorks: worksData.length,
    totalImages: mergedData.length,
    aiOverviewCache: aiStats  // ADD THIS
  });
});
```

---

### Step 5: Frontend Integration

Update `public/client.js`:

Add these functions after the `createWorkResultElement` function (around line 500):

```javascript
// AI Overview functions
function showAIOverviewLoading() {
  const container = document.getElementById('worksResultsScreen');
  const loadingHTML = `
    <div id="aiOverviewContainer" class="ai-overview-container">
      <div class="ai-overview-loading">
        <div class="loading-shimmer"></div>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('afterbegin', loadingHTML);
}

function hideAIOverview() {
  const container = document.getElementById('aiOverviewContainer');
  if (container) {
    container.remove();
  }
}

async function fetchAIOverview(query, topWorks) {
  try {
    const response = await fetch('/api/ai-overview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        works: topWorks.slice(0, 3) // Top 3 works
      })
    });

    if (!response.ok) {
      throw new Error('AI Overview request failed');
    }

    const data = await response.json();
    displayAIOverview(data.overview, data.cached);

  } catch (error) {
    console.error('Error fetching AI overview:', error);
    hideAIOverview();
  }
}

function displayAIOverview(text, cached = false) {
  const container = document.getElementById('aiOverviewContainer');
  if (!container) return;

  const cacheLabel = cached ? ' <span class="cache-badge">Cached</span>' : '';

  container.innerHTML = `
    <div class="ai-overview-card">
      <div class="ai-overview-header">
        <svg class="ai-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z"/>
        </svg>
        <span class="ai-label">AI Overview${cacheLabel}</span>
      </div>
      <p class="ai-overview-text">${text}</p>
      <div class="ai-overview-footer">
        <span class="ai-disclaimer">Generated summary • May not reflect all nuances</span>
      </div>
    </div>
  `;
}
```

Update the `searchWorks` function (around line 178):

```javascript
async function searchWorks() {
  updateStatus("Searching...");
  worksResultsDiv.innerHTML = "";
  imagesResultsDiv.style.display = "none";

  workSearchFormat();

  const query = searchInput.value.trim();
  if (!query) {
    updateStatus("Please enter a search term");
    return;
  }

  try {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        searchType: "multimodal",
        maxResults: 20
      }),
    });

    if (!response.ok) {
      throw new Error("Search request failed");
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      // Show AI overview loading skeleton
      showAIOverviewLoading();

      // Display results immediately
      data.results.forEach((result) => {
        const workDiv = createWorkResultElement(result);
        worksResultsDiv.appendChild(workDiv);
      });

      worksResultsDiv.style.display = "block";
      updateStatus(`Found ${data.results.length} works`);

      // Fetch AI overview in background (don't block results)
      fetchAIOverview(query, data.results);

    } else {
      updateStatus("No works found");
    }
  } catch (error) {
    console.error("Error during search:", error);
    updateStatus("Error searching for works");
  }
}
```

---

### Step 6: Add CSS Styling

Add to `public/css/desktop.css` (at the end, before media queries):

```css
/* ========================================
   AI OVERVIEW CARD STYLING
   ======================================== */

.ai-overview-container {
  width: 100%;
  max-width: 600px;
  margin-bottom: 24px;
}

.ai-overview-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border-left: 4px solid #1a73e8;
  transition: box-shadow 0.2s ease;
}

.ai-overview-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.ai-overview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #5f6368;
  font-size: 13px;
  font-weight: 500;
}

.ai-icon {
  color: #1a73e8;
  flex-shrink: 0;
}

.ai-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cache-badge {
  background: #e8f0fe;
  color: #1a73e8;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.ai-overview-text {
  color: #202124;
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 12px 0;
  font-weight: 400;
}

.ai-overview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ai-disclaimer {
  color: #70757a;
  font-size: 12px;
  font-style: italic;
}

/* Loading skeleton animation */
.ai-overview-loading {
  background: #f0f0f0;
  border-radius: 16px;
  height: 120px;
  position: relative;
  overflow: hidden;
}

.loading-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.6) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* Mobile responsive */
@media screen and (max-width: 768px) {
  .ai-overview-card {
    padding: 16px 20px;
    border-radius: 12px;
  }

  .ai-overview-text {
    font-size: 14px;
  }

  .ai-overview-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
```

---

### Step 7: Update Git LFS

Add to `.gitattributes`:

```
models/**/*.safetensors filter=lfs diff=lfs merge=lfs -text
models/**/*.msgpack filter=lfs diff=lfs merge=lfs -text
```

Commit LFS changes:
```bash
git add .gitattributes
git commit -m "Track Phi-3 Mini model files with Git LFS"
```

---

## 🧪 Testing

### Test 1: Model Loading
```bash
npm start

# Check console for:
# ✓ AI Overview model ready
```

### Test 2: API Endpoint
```bash
curl -X POST http://localhost:3000/api/ai-overview \
  -H "Content-Type: application/json" \
  -d '{
    "query": "digital identity",
    "works": [
      {
        "id": "work_001",
        "title": "Digital Identity Series",
        "year": "2023",
        "medium": ["Digital Art", "Algorithm"],
        "description": "An exploration of digital identity through algorithmic art."
      }
    ]
  }'
```

Expected response:
```json
{
  "overview": "This work explores digital identity through algorithmic processes and generative systems. By using computational methods, it questions how technology shapes our sense of self in the digital age.",
  "cached": false,
  "worksCount": 1
}
```

### Test 3: Frontend Integration
1. Start server: `npm start`
2. Visit `http://localhost:3000`
3. Search for "digital identity"
4. Verify:
   - Loading skeleton appears
   - AI overview card displays
   - Results appear below overview
   - Second search is faster (cached)

### Test 4: Cache Performance
```bash
# Search same term twice
curl -X POST http://localhost:3000/api/ai-overview -d '{"query":"test","works":[...]}'
curl -X POST http://localhost:3000/api/ai-overview -d '{"query":"test","works":[...]}'

# Second request should return "cached": true
```

---

## 🎨 Style Customization

### Option A: Adjust Temperature (Easy)

In `server/ai-overview.js`, line 95:

```javascript
temperature: 0.5,  // More focused (0.3-0.5)
temperature: 0.7,  // Balanced (default)
temperature: 0.9,  // More creative (0.8-1.0)
```

### Option B: Add More Examples (Medium)

Update `buildPrompt` function with your actual writing samples:

```javascript
function buildPrompt(query, works) {
  const STYLE_EXAMPLES = `
Example 1:
Query: "memory and space"
Works: Memory Palace Installation (2022)
Overview: "This installation transforms spatial cognition into collective experience. Through AR overlays and motion-responsive systems, it creates a shared memory space where individual interactions build communal narratives."

Example 2:
Query: "machine learning art"
Works: Algorithmic Portraits (2023)
Overview: "Neural networks trained on classical portraiture create new works that question authorship and artistic tradition. These algorithmic portraits blend centuries of technique with contemporary computational processes."
`;

  return `<|system|>
You are an art curator describing Fabrizio Guccione's work.

${STYLE_EXAMPLES}

Guidelines:
- 2-3 sentences max
- Focus on concepts, not technical details
- Poetic but clear
- Connect to query thematically
<|end|>

<|user|>
Query: "${query}"
Works: ${formatWorks(works)}
<|end|>

<|assistant|>`;
}
```

### Option C: Fine-Tune with LoRA (Advanced)

**Requirements:**
- 20-30 training examples
- Python environment with `transformers`, `peft`, `bitsandbytes`
- 2-4 hours of GPU time

**Process:**
1. Create training data:
   ```json
   [
     {
       "instruction": "Describe this artwork for a portfolio",
       "input": "[work title + metadata]",
       "output": "[your description]"
     }
   ]
   ```

2. Fine-tune:
   ```python
   from transformers import AutoModelForCausalLM, AutoTokenizer
   from peft import LoraConfig, get_peft_model

   # Load base model
   model = AutoModelForCausalLM.from_pretrained("microsoft/Phi-3-mini-4k-instruct")

   # Add LoRA adapter
   lora_config = LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"])
   model = get_peft_model(model, lora_config)

   # Train on your data
   # ... (trainer code)

   # Save adapter (~10-50MB)
   model.save_pretrained("./models/phi3-guccione-lora")
   ```

3. Load in production:
   ```javascript
   const model = await AutoModelForCausalLM.from_pretrained(
     'microsoft/Phi-3-mini-4k-instruct'
   );

   // Load your adapter
   await model.load_adapter('./models/phi3-guccione-lora');
   ```

---

## 🚨 Troubleshooting

### Issue: Model fails to load
```
Error: CUDA out of memory
```
**Solution:**
- Check GPU has 8GB+ VRAM: `nvidia-smi`
- Use quantized model (already enabled)
- Reduce batch size or max tokens

### Issue: Slow inference (>2 seconds)
**Solutions:**
1. Enable ONNX Runtime:
   ```bash
   npm install onnxruntime-node
   ```

2. Preload model on startup (already implemented)

3. Use smaller model (Gemma 2B or TinyLlama)

### Issue: Generic/poor quality summaries
**Solutions:**
1. Add more style examples to prompt
2. Increase temperature to 0.8-0.9
3. Fine-tune with LoRA (best option)

### Issue: Cache not working
**Check:**
```javascript
// Add logging
console.log('Cache stats:', aiOverview.getCacheStats());
```

**Clear cache:**
```javascript
// In Node REPL
const cache = require('./server/ai-overview').cache;
cache.flushAll();
```

---

## 📊 Performance Metrics

**Expected Performance:**
- Cold start: ~3 seconds (first query)
- Warm inference: 400-800ms
- Cached response: <50ms
- Cache hit rate: 60-80% (depends on traffic)

**Optimization Tips:**
1. Preload model on server start ✓ (already done)
2. Use quantized model ✓ (already done)
3. Implement cache ✓ (already done)
4. Add request queue for multiple concurrent requests
5. Monitor with `/health` endpoint

---

## 🔄 Next Steps After Implementation

1. **A/B Test:** Show AI overview to 50% of users, measure engagement
2. **Collect Feedback:** Add "Was this helpful?" buttons
3. **Iterate on Style:** Refine prompt based on user feedback
4. **Expand Features:**
   - "Show more" to expand overview
   - Sources/citations to specific works
   - Toggle to disable AI overview
   - Alternative perspectives (different LLMs)

---

## 📚 Additional Resources

- [Phi-3 Mini Documentation](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct)
- [Transformers.js Guide](https://huggingface.co/docs/transformers.js)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

---

*Implementation time: 8-12 hours*
*Maintenance: ~1 hour/month (monitor, adjust prompts)*
*Cost: Included in GPU server costs (no additional API fees)*
