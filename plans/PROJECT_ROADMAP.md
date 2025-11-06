# Guccione Browser - Project Roadmap & Continuation Guide

**Last Updated:** 2025-01-06
**Current Branch:** `new-google-aesthetic`
**Status:** Modern Google UI implemented, AI Overview feature planned

---

## 📋 Project Overview

**Guccione Browser** is a Google-inspired semantic search engine for your creative portfolio, using:
- **AI Models**: CLIP (image-text), MiniLM (text embeddings)
- **Stack**: Node.js/Express, HuggingFace Transformers, Pure JSON storage
- **Hosting**: Digital Ocean with GPU
- **Design**: Toggle between 2007-2009 Google nostalgia and 2024/2025 modern UI

---

## 🌿 Git Branches Overview

### `main`
- Production-ready code
- Merged Phase 1 & 2 improvements
- Original 2007-2009 Google aesthetic

### `phase1-critical-fixes`
- Fixed responsive design issues
- Added work thumbnails
- Improved mobile/tablet experience

### `phase2-enhanced-features`
- "I'm Feeling Lucky" functionality
- Polished autocomplete/suggestions
- Enhanced button and input styling

### `new-google-aesthetic` (CURRENT)
- Modern Google 2024/2025 UI
- Material Design navigation
- Rounded corners, shadows, modern colors
- Fully responsive

---

## ✅ Completed Work

### Phase 1: Critical Bugs & Responsive Design
- [x] Fixed Works/Images container overlap bug
- [x] Centered layouts across all viewports
- [x] Added 3 responsive breakpoints (desktop, tablet, mobile)
- [x] Fixed search bar overlapping results (250px margin-top)
- [x] Added work result thumbnails with flexbox
- [x] Set up Git LFS for images and models
- [x] Restored original 2007-2009 Google aesthetic

### Phase 2: Enhanced Features
- [x] Implemented "I'm Feeling Lucky" (navigates to top result)
- [x] Enhanced autocomplete with better styling
- [x] Added disabled button states
- [x] Fixed search mode switching bug (Works vs Images)
- [x] Improved responsive autocomplete on mobile

### Phase 3: Modern Google UI (NEW)
- [x] Redesigned with Material Design principles
- [x] Rounded search bar (24px border-radius)
- [x] Pills-style navigation tabs
- [x] Modern color palette (#1a73e8, #5f6368, etc.)
- [x] Google Sans typography
- [x] Card-based results layout
- [x] Elevated shadows and smooth transitions
- [x] Full responsive optimization

---

## 🚀 Next Steps: Phase 4 & Beyond

### Phase 4: AI Overview Feature (HIGH PRIORITY)

**Goal:** Add Google-style AI-generated summaries above search results

#### Recommended Model: **Phi-3 Mini (3.8B)**
- **Provider:** Microsoft
- **Size:** ~7GB ONNX model
- **VRAM:** 8GB required
- **Speed:** ~500ms inference
- **HuggingFace:** `microsoft/Phi-3-mini-4k-instruct`

#### Alternative Options:
1. **Gemma 2B** (Google) - Thematic fit, 4GB VRAM
2. **Qwen 2.5 3B** - Best quality/size ratio, 6GB VRAM
3. **TinyLlama 1.1B** - Fastest, 2GB VRAM (lower quality)

#### Implementation Steps:

**Step 1: Model Setup (1-2 hours)**
```bash
# Install dependencies
npm install @xenova/transformers onnxruntime-node

# Download model (one-time, ~7GB)
node scripts/download-phi3-model.js
```

**Step 2: Create AI Service (2-3 hours)**
```javascript
// server/ai-overview.js
const { pipeline } = require('@xenova/transformers');

let summarizer = null;

async function initialize() {
  summarizer = await pipeline('text-generation',
    'microsoft/Phi-3-mini-4k-instruct', {
      device: 'cuda', // Use GPU
      quantized: true
    });
}

async function generateOverview(query, works) {
  const prompt = buildPrompt(query, works);
  const response = await summarizer(prompt, {
    max_new_tokens: 150,
    temperature: 0.7,
    top_p: 0.9
  });
  return response[0].generated_text;
}

function buildPrompt(query, works) {
  return `You are an art curator describing Fabrizio Guccione's portfolio.

Style guidelines:
- Concise, 2-3 sentences maximum
- Poetic but clear, focus on concepts
- Mention medium/technology when relevant
- Connect works thematically

Works found for "${query}":
${works.map(w => `- ${w.title}: ${w.description}`).join('\n')}

Generate a brief overview connecting these works to the query:`;
}

module.exports = { initialize, generateOverview };
```

**Step 3: Add API Endpoint (30 min)**
```javascript
// In server/server.js
const aiOverview = require('./ai-overview');

// Initialize with other models
await aiOverview.initialize();

// New endpoint
app.post('/api/ai-overview', async (req, res) => {
  try {
    const { query, works } = req.body;
    const overview = await aiOverview.generateOverview(query, works);
    res.json({ overview, cached: false });
  } catch (error) {
    console.error('AI Overview error:', error);
    res.status(500).json({ error: 'Failed to generate overview' });
  }
});
```

**Step 4: Frontend Integration (2-3 hours)**
```javascript
// In public/client.js
async function searchWorks() {
  // ... existing search code ...

  // After getting results, fetch AI overview
  if (data.results && data.results.length > 0) {
    displayResults(data.results);

    // Show loading skeleton
    showAIOverviewLoading();

    // Fetch AI overview in background
    fetchAIOverview(query, data.results.slice(0, 3));
  }
}

async function fetchAIOverview(query, topWorks) {
  try {
    const response = await fetch('/api/ai-overview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, works: topWorks })
    });

    const { overview } = await response.json();
    displayAIOverview(overview);
  } catch (error) {
    console.error('AI Overview failed:', error);
    hideAIOverview();
  }
}

function displayAIOverview(text) {
  const container = document.getElementById('aiOverviewContainer');
  container.innerHTML = `
    <div class="ai-overview-card">
      <div class="ai-overview-header">
        <span class="ai-icon">✨</span>
        <span class="ai-label">AI Overview</span>
      </div>
      <p class="ai-overview-text">${text}</p>
      <button class="ai-expand">Show more</button>
    </div>
  `;
  container.style.display = 'block';
}
```

**Step 5: Add CSS Styling (30 min)**
```css
/* AI Overview Card - Modern Google Style */
.ai-overview-card {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-left: 4px solid #1a73e8;
}

.ai-overview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #5f6368;
  font-size: 14px;
  font-weight: 500;
}

.ai-icon {
  font-size: 18px;
}

.ai-overview-text {
  color: #202124;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 12px;
}

.ai-expand {
  background: none;
  border: none;
  color: #1a73e8;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}

.ai-expand:hover {
  text-decoration: underline;
}

/* Loading skeleton */
.ai-overview-loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
  height: 80px;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Step 6: Style Personalization (Advanced - Optional)**

To make the AI write in YOUR style:

**Option A: Few-Shot Prompting (Easy, 1 hour)**
```javascript
const STYLE_EXAMPLES = `
Example 1:
Query: "digital identity"
Overview: "These works explore digital identity through algorithmic processes and generative systems. Each piece questions how technology shapes our sense of self, using data as both medium and message to create portraits of our algorithmic existence."

Example 2:
Query: "interactive installation"
Overview: "Spatial computing meets collective memory in these interactive installations. Through AR and spatial interfaces, visitors navigate digital overlays that respond to presence and movement, building shared narratives from individual experiences."
`;

function buildPrompt(query, works) {
  return `${STYLE_EXAMPLES}

Now generate an overview for:
Query: "${query}"
Works: ${works.map(w => `${w.title}: ${w.description}`).join('\n')}

Overview:`;
}
```

**Option B: LoRA Fine-Tuning (Advanced, 4-6 hours)**
1. Collect 20-30 work descriptions you've written
2. Format as training data:
   ```json
   [
     {
       "input": "Describe this artwork: [title + metadata]",
       "output": "Your written description"
     }
   ]
   ```
3. Fine-tune Phi-3 Mini with LoRA (~2 hours on GPU)
4. Upload adapter (10-50MB) alongside base model
5. Load adapter at runtime

**Step 7: Performance Optimization (1-2 hours)**
```javascript
// Add caching to avoid re-generating
const NodeCache = require('node-cache');
const overviewCache = new NodeCache({ stdTTL: 3600 }); // 1 hour

app.post('/api/ai-overview', async (req, res) => {
  const { query, works } = req.body;
  const cacheKey = `${query}_${works.map(w => w.id).join('_')}`;

  // Check cache first
  const cached = overviewCache.get(cacheKey);
  if (cached) {
    return res.json({ overview: cached, cached: true });
  }

  // Generate new
  const overview = await aiOverview.generateOverview(query, works);
  overviewCache.set(cacheKey, overview);

  res.json({ overview, cached: false });
});
```

**Testing Checklist:**
- [ ] Model loads successfully on GPU
- [ ] Inference time < 1 second
- [ ] Overview quality matches style
- [ ] Mobile responsive layout
- [ ] Loading skeleton displays properly
- [ ] Cache working (check logs)
- [ ] Error handling (model fails, timeout)

**Estimated Total Time:** 8-12 hours

---

### Phase 5: Content & Polish (MEDIUM PRIORITY)

#### A. Individual Work Pages
**Status:** Structure exists, needs population
**Time:** 4-6 hours

**What to do:**
1. Design work page template (hero image, description, gallery, metadata)
2. Create generator script:
   ```bash
   node scripts/generate-work-pages.js
   ```
3. Use data from `data/works.json` to populate pages
4. Add navigation breadcrumbs
5. Implement image lightbox/gallery
6. Add social sharing meta tags

**Files to create:**
- `/public/work/[work-slug].html` for each work
- `/public/css/work-page.css` for styling
- Update `scripts/generate-work-pages.js`

#### B. About Page
**Status:** Placeholder link exists
**Time:** 2-3 hours

**Content to include:**
- Bio/artist statement
- Technical details about the project
- Links to social media / portfolio
- Contact information
- Credits (Claude Code, HuggingFace, etc.)

**File:** `/public/about.html`

#### C. Additional Features
- [ ] Save search history (already tracked server-side)
- [ ] Export search results
- [ ] Keyboard shortcuts (/ to focus search)
- [ ] Dark mode toggle
- [ ] Share search results URLs

---

### Phase 6: Performance & Deployment (LOW PRIORITY)

#### A. Model Optimization
- [ ] Quantize CLIP and MiniLM to INT8 (2x faster)
- [ ] Use ONNX Runtime for all models
- [ ] Implement model warm-up on server start
- [ ] Add request batching for multiple searches

#### B. Caching Strategy
- [ ] Redis for search result caching
- [ ] CDN for static assets (images, CSS, JS)
- [ ] Service Worker for offline functionality
- [ ] Preload common queries

#### C. Analytics & Monitoring
- [ ] Privacy-friendly analytics (Plausible or self-hosted)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (response times)
- [ ] Search query logs for insights

#### D. SEO & Accessibility
- [ ] Add semantic HTML
- [ ] ARIA labels for screen readers
- [ ] Improve meta tags and Open Graph
- [ ] Generate sitemap.xml
- [ ] Add robots.txt

---

## 🔧 Known Issues & Improvements Needed

### Minor Issues:
1. **Logo/Input Alignment (Tablet)**
   - **Issue:** Logo and search bar misalign slightly when resizing on tablet viewport
   - **Location:** `public/css/desktop.css` - tablet media query
   - **Fix:** Manually adjust in CSS or JavaScript `workSearchFormat()`
   - **Priority:** Low (cosmetic only)

2. **Search History File Size**
   - **Issue:** `data/search-history.json` grows to 445KB+ with embeddings
   - **Impact:** Slower loading over time
   - **Fix:** Implement periodic cleanup (keep last 1000 queries)
   - **File:** Create `scripts/cleanup-search-history.js`

3. **Autocomplete on Mobile**
   - **Issue:** Dropdown can extend off-screen on small devices
   - **Fix:** Add max-height and better scrolling in mobile breakpoint
   - **Priority:** Low

### Potential Enhancements:
1. **Image Search Improvements**
   - Better caption generation (currently placeholder-heavy)
   - Grid layout options (dense vs comfortable)
   - Image size filters

2. **Search Filters**
   - Filter by year, medium, category
   - Sort options (relevance, date, title)
   - Advanced search syntax

3. **Bulk Operations**
   - Regenerate all embeddings at once
   - Batch upload images with auto-captioning
   - Export/import works data

---

## 📚 Technical Setup Guide

### Prerequisites
```bash
# Node.js 18+ and npm
node --version  # Should be v18+
npm --version

# Git with LFS
git lfs version

# Python 3.8+ (for model scripts)
python3 --version

# GPU with CUDA (for inference)
nvidia-smi  # Check GPU availability
```

### Initial Setup (Fresh Clone)
```bash
# Clone repository
git clone https://github.com/FabriGu/guccione-browser-search.git
cd guccione-browser-search

# Install dependencies
npm install

# Set up Git LFS
git lfs install
git lfs pull  # Download images and models

# Download models (if not via LFS)
npm run download-models

# Generate embeddings
node scripts/generate-work-embeddings.js
node generateEmbeddings.js  # For images

# Start server
npm start
# Visit http://localhost:3000
```

### Switching Between UI Styles
```bash
# Modern Google 2024/2025 UI
git checkout new-google-aesthetic

# Vintage Google 2007-2009 UI
git checkout main

# Restart server to see changes
npm start
```

### Development Workflow
```bash
# Create new feature branch
git checkout -b feature/your-feature-name

# Make changes, test locally
npm start

# Commit with descriptive message
git add .
git commit -m "Add feature: description"

# Push to GitHub
git push origin feature/your-feature-name

# Create pull request on GitHub
# Merge when ready
```

---

## 📁 Project Structure

```
guccione-browser-search/
├── server/
│   ├── server.js              # Main Express server
│   ├── image-search.js        # CLIP image search logic
│   ├── text-embeddings.js     # MiniLM text embeddings
│   ├── work-search.js         # Multimodal work search
│   ├── caption-service.js     # Image captioning
│   └── model-config.js        # Model paths and settings
├── public/
│   ├── index.html             # Main homepage
│   ├── client.js              # Frontend JavaScript
│   ├── css/
│   │   └── desktop.css        # All styling (responsive)
│   ├── assets/
│   │   └── guccioneComV1.png  # Logo
│   ├── images/                # Portfolio images (Git LFS)
│   └── work/                  # Individual work pages
├── data/
│   ├── works.json             # Works metadata
│   ├── works-with-embeddings.json
│   ├── image-embeddings.json  # CLIP embeddings
│   ├── image-captions.json    # Generated captions
│   └── search-history.json    # Search logs (cleanup needed)
├── models/
│   └── huggingface/           # Downloaded models (Git LFS)
│       ├── clip/
│       ├── minilm/
│       └── phi3/              # (To be added for AI overview)
├── scripts/
│   ├── generate-work-pages.js
│   ├── generate-work-embeddings.js
│   ├── download-models.js
│   └── check-models.js
├── plans/
│   └── PROJECT_ROADMAP.md     # This document
├── .gitattributes             # Git LFS configuration
├── package.json
└── README.md
```

---

## 🎯 Priority Matrix

| Phase | Feature | Priority | Effort | Impact |
|-------|---------|----------|--------|--------|
| 4 | AI Overview | HIGH | 8-12h | HIGH |
| 5A | Work Pages | MEDIUM | 4-6h | MEDIUM |
| 5B | About Page | MEDIUM | 2-3h | LOW |
| 5C | Additional Features | LOW | varies | MEDIUM |
| 6 | Performance & Deploy | LOW | 20h+ | HIGH* |

*High impact long-term, but not urgent

---

## 🚦 Quick Start Guide (Returning to Project)

### Option 1: Continue Modern UI Development
```bash
cd guccione-browser-search
git checkout new-google-aesthetic
git pull origin new-google-aesthetic
npm start
# Test modern UI at http://localhost:3000
```

### Option 2: Implement AI Overview
```bash
cd guccione-browser-search
git checkout new-google-aesthetic
git checkout -b feature/ai-overview

# Follow Phase 4 implementation steps above
# Start with Step 1: Model Setup

# Install transformers
npm install @xenova/transformers

# Create AI service file
# (See detailed code in Phase 4 section)
```

### Option 3: Work on Content Pages
```bash
cd guccione-browser-search
git checkout new-google-aesthetic
git checkout -b feature/work-pages

# Update works.json with full content
# Run generator script
node scripts/generate-work-pages.js

# Preview pages
npm start
```

---

## 📊 Progress Tracking

### Completed: ✅
- [x] Phase 1: Critical bugs fixed
- [x] Phase 2: Enhanced features
- [x] Phase 3: Modern Google UI
- [x] Git LFS setup
- [x] Responsive design (3 breakpoints)
- [x] Search autocomplete
- [x] I'm Feeling Lucky
- [x] Dual UI styles (vintage/modern)

### In Progress: 🚧
- [ ] Phase 4: AI Overview feature

### Not Started: ⏸️
- [ ] Phase 5: Content & polish
- [ ] Phase 6: Performance & deployment

---

## 📞 Resources & References

### Documentation
- [HuggingFace Transformers.js](https://huggingface.co/docs/transformers.js)
- [ONNX Runtime Node.js](https://onnxruntime.ai/docs/get-started/with-javascript.html)
- [Material Design Guidelines](https://m3.material.io/)
- [Google Search Design System](https://fonts.google.com/knowledge)

### Models
- [CLIP (Xenova)](https://huggingface.co/Xenova/clip-vit-base-patch16)
- [MiniLM (Xenova)](https://huggingface.co/Xenova/all-MiniLM-L6-v2)
- [Phi-3 Mini](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct)
- [Gemma 2B](https://huggingface.co/google/gemma-2b-it)
- [Qwen 2.5 3B](https://huggingface.co/Qwen/Qwen2.5-3B-Instruct)

### Tools
- [Git LFS](https://git-lfs.github.com/)
- [Digital Ocean GPU Droplets](https://www.digitalocean.com/products/gpu-droplets)
- [Claude Code](https://claude.com/claude-code)

---

## 🤔 Decision Points & Considerations

### AI Model Selection Criteria
When choosing the LLM for AI Overview:

1. **Phi-3 Mini** - Best for quality summaries, familiar style
   - ✅ Excellent instruction following
   - ✅ Good at creative/art descriptions
   - ⚠️ Requires 8GB VRAM

2. **Gemma 2B** - Best for Google theme consistency
   - ✅ Official Google model (brand fit)
   - ✅ Smaller size (4GB VRAM)
   - ⚠️ Slightly less creative

3. **Qwen 2.5 3B** - Best balance
   - ✅ Very high quality for size
   - ✅ Fast inference (6GB VRAM)
   - ⚠️ Less known brand

### UI Style Strategy
You now have TWO UI styles in separate branches:

**Recommendation:**
1. Keep `main` branch as 2007-2009 Google (nostalgia/artistic statement)
2. Deploy `new-google-aesthetic` as default public site (better UX)
3. Add UI toggle switch to let visitors choose (Phase 5C feature)

### Deployment Platform
- **Current:** Digital Ocean GPU droplet
- **Alternative:** Railway, Render, or Fly.io (GPU tiers)
- **Pro:** More control, dedicated GPU
- **Con:** Higher cost (~$50-100/mo)

**Cost Optimization:**
- Use serverless for static hosting (Vercel/Netlify)
- Keep GPU droplet only for API/model inference
- Scale down when not in use

---

## 📝 Notes & Tips

### Git LFS Best Practices
```bash
# Check LFS files
git lfs ls-files

# Track new large files
git lfs track "*.safetensors"
git lfs track "*.onnx"

# Update .gitattributes
git add .gitattributes
git commit -m "Track new model format"
```

### Model Loading Tips
```javascript
// Preload models on server start to avoid cold starts
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Warm up models
  console.log('Warming up models...');
  await imageSearch.search('test query', []);
  await textEmbeddings.embed('test');
  console.log('Models ready!');
});
```

### Debugging Commands
```bash
# Check model files exist
ls -lh models/huggingface/

# Monitor GPU usage
watch -n 1 nvidia-smi

# Check server logs
npm start 2>&1 | tee server.log

# Test embeddings
node -e "
  const textEmbed = require('./server/text-embeddings');
  textEmbed.initialize().then(() => {
    return textEmbed.embed('digital art');
  }).then(embedding => {
    console.log('Embedding:', embedding.slice(0, 5));
  });
"
```

---

## 🎨 Design Philosophy

### Visual Identity
**2007-2009 Mode (Nostalgia):**
- Minimal, functional aesthetic
- Simple sans-serif fonts
- Solid borders, no shadows
- High contrast blue (#0000cc) links
- Playful throwback to early web

**2024/2025 Mode (Modern):**
- Material Design principles
- Google Sans typography
- Rounded corners, subtle shadows
- Modern blue (#1a73e8) palette
- Polished, professional UX

### Content Strategy
Your portfolio is about:
1. **Digital Identity** - Technology shaping self-perception
2. **Algorithmic Art** - Machine learning as creative tool
3. **Interactive Spaces** - AR/VR spatial computing
4. **Data Visualization** - Translating information to art

**AI Overview Should:**
- Emphasize conceptual themes over technical details
- Use poetic but clear language
- Connect works thematically
- Highlight your unique approach to tech + art

---

## 🔄 Version History

- **v0.1** (Dec 2024): Initial project with CLIP search
- **v0.2** (Jan 2025): Added works search, autocomplete
- **v1.0** (Jan 6, 2025): Phase 1 & 2 complete, responsive design
- **v1.5** (Jan 6, 2025): Modern Google UI implemented
- **v2.0** (Planned): AI Overview feature

---

## 📧 Contact & Support

**Project Maintainer:** Fabrizio Guccione
**AI Assistant:** Claude Code (Anthropic)
**Repository:** https://github.com/FabriGu/guccione-browser-search

**Questions?** Review this roadmap, check existing issues, or create new one on GitHub.

---

## 🎯 TL;DR - Next Session Checklist

Pick ONE path and follow it:

### Path A: Implement AI Overview (Most Impact)
1. ✅ `git checkout new-google-aesthetic`
2. ✅ `git checkout -b feature/ai-overview`
3. ⏱️ Follow **Phase 4** steps above (8-12 hours)
4. ✅ Test locally, commit, push
5. ✅ Merge to `new-google-aesthetic`

### Path B: Polish Existing Features (Quick Wins)
1. ✅ Fix tablet logo alignment issue (1 hour)
2. ✅ Create About page (2 hours)
3. ✅ Add keyboard shortcuts (1 hour)
4. ✅ Implement dark mode (3 hours)

### Path C: Generate Work Pages (Content)
1. ✅ Update `data/works.json` with full descriptions
2. ✅ Enhance `scripts/generate-work-pages.js`
3. ✅ Design work page template
4. ✅ Generate all pages (4-6 hours)

**Recommended:** Start with Path A (AI Overview) - highest impact feature that differentiates your portfolio search from standard portfolios.

---

*Last updated: January 6, 2025*
*Generated with Claude Code*
