# Guccione Browser - Project Documentation

Documentation for the Guccione Browser semantic search portfolio system.

## What is Guccione Browser?

Guccione Browser is a Google-inspired portfolio search engine that uses AI embeddings (CLIP for images, MiniLM for text) to enable semantic search across your creative work. It features:

- **Semantic Search**: Natural language queries for your portfolio
- **Multi-modal Search**: Search works by text or find images by visual concepts
- **JSON-Driven CMS**: Easy content management without coding
- **Minimalist Design**: Inspired by modern portfolio sites
- **Zero-Shot Autocomplete**: Smart suggestions using embeddings

## Documentation Files

### 📚 [Content Management Guide](./CONTENT_MANAGEMENT.md)
**Start here** if you want to add or edit projects.

Complete guide for managing portfolio content:
- Adding new projects
- Customizing themes and layouts
- Gallery configurations
- Custom sections
- Theme presets
- Troubleshooting

**Use cases:**
- "How do I add a new project?"
- "How do I change the background color?"
- "What gallery layouts are available?"
- "How do I add custom sections?"

---

### 🔍 [Embeddings & Search Guide](./EMBEDDINGS_GUIDE.md)
**For advanced users** managing the search system.

Technical guide for embeddings and search:
- How the semantic search works
- Generating embeddings for new content
- Optimizing search performance
- Managing autocomplete suggestions
- Troubleshooting search issues

**Use cases:**
- "How do I make my new images searchable?"
- "How does the autocomplete work?"
- "How can I improve search results?"
- "What models are being used?"

---

## Quick Reference

### Project Structure
```
guccione-browser-search/
├── data/
│   ├── projects/              # Project JSON files
│   │   ├── schema.json        # JSON schema definition
│   │   ├── sample-project.json
│   │   └── [your-projects].json
│   └── search-history.json    # Autocomplete suggestions
├── public/
│   ├── assets/
│   │   └── projects/          # Project images
│   │       └── [project-id]/
│   ├── css/
│   │   ├── desktop.css        # Main search UI styles
│   │   └── project.css        # Project page styles
│   ├── js/
│   │   └── project-loader.js  # Project page loader
│   ├── client.js              # Main search client
│   ├── index.html             # Search homepage
│   └── project.html           # Project page template
├── server/
│   └── server.js              # Express backend with embeddings
└── docs/                      # This documentation
```

### Common Tasks

#### Add a New Project
1. Create JSON: `data/projects/my-project.json`
2. Add images: `public/assets/projects/my-project/`
3. View: `http://localhost:3000/project.html?id=my-project`

See: [Content Management Guide - Quick Start](./CONTENT_MANAGEMENT.md#quick-start)

#### Update Search Index
1. Projects auto-indexed on server start
2. For images: Generate CLIP embeddings (see Embeddings Guide)
3. Restart server: `npm run dev`

See: [Embeddings Guide - Adding New Content](./EMBEDDINGS_GUIDE.md#adding-new-project-content)

#### Customize Theme
Edit project JSON:
```json
"theme": {
  "backgroundColor": "#ffffff",
  "accentColor": "#ff0000",
  "textColor": "rgba(0, 0, 0, 0.85)",
  "fontFamily": "Your Font, sans-serif"
}
```

See: [Content Management Guide - Theme Customization](./CONTENT_MANAGEMENT.md#theme-customization)

#### Change Gallery Layout
Edit project JSON:
```json
"gallery": {
  "layout": "justified",  // or "grid", "masonry", "slideshow"
  "columns": 3,           // for grid/masonry
  "gutter": "1.1rem",
  "images": [...]
}
```

See: [Content Management Guide - Gallery Layouts](./CONTENT_MANAGEMENT.md#gallery-layouts)

---

## Architecture Overview

### Frontend (Vanilla JS)
- **Main Search** (`index.html` + `client.js`): Google-style search interface
- **Project Pages** (`project.html` + `project-loader.js`): Dynamic JSON-driven templates
- **Styles** (`desktop.css` + `project.css`): Responsive minimalist design

### Backend (Node.js + Express)
- **Server** (`server/server.js`): Express server with API endpoints
- **Models**: Transformers.js (CLIP + MiniLM) for embeddings
- **Endpoints**:
  - `/api/search` - Text search for works
  - `/api/search/images` - Visual search for images
  - `/api/suggestions` - Autocomplete suggestions

### Data Layer
- **Project Data**: JSON files in `/data/projects/`
- **Embeddings**: Pre-computed vectors for fast similarity search
- **Search History**: Query suggestions with embeddings

### Search Pipeline
```
User Query
    ↓
MiniLM/CLIP Embedding
    ↓
Cosine Similarity (70% text, 30% image)
    ↓
Ranked Results
    ↓
Display with Google aesthetic
```

---

## Technology Stack

### Frontend
- Vanilla JavaScript (no framework)
- CSS3 (Grid, Flexbox, CSS Variables)
- HTML5 with semantic markup

### Backend
- Node.js 16+
- Express.js
- Transformers.js (Hugging Face)
  - CLIP-ViT-Base-Patch16 (image embeddings)
  - MiniLM-L6-v2 (text embeddings)

### Deployment
- Digital Ocean
- GitHub push-to-deploy
- pm2 process manager

---

## Design Principles

### Minimalism
Inspired by:
- **jnackash.com**: Dark mode, generous whitespace, typography hierarchy
- **shuangli.info**: Bold accent colors, masonry layouts, image-first
- **shuangcai.cargo.site**: Grid system, monochrome, single typeface

### Key Patterns
1. **Generous whitespace** (5rem column gutters, 6rem section spacing)
2. **Typography-driven** (scale from 1.1rem to 5.2rem)
3. **Limited color palette** (monochrome + single accent)
4. **Content-focused** (minimal decoration, functional only)
5. **Grid-based positioning** (2-6 column layouts)

---

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev

# View in browser
open http://localhost:3000
```

### Adding Content
1. Create project JSON in `/data/projects/`
2. Add images to `/public/assets/projects/<project-id>/`
3. Test locally: `/project.html?id=<project-id>`
4. Generate embeddings (for searchability)
5. Commit and push

### Deployment
```bash
# Commit changes
git add .
git commit -m "Add new project: Title"

# Push to main (auto-deploys)
git push origin main
```

Digital Ocean automatically pulls and restarts server.

---

## Troubleshooting

### Server won't start
- Check Node.js version: `node -v` (need 16+)
- Check port 3000 available: `lsof -i :3000`
- Clear cache: `rm -rf node_modules/.cache`
- Reinstall: `rm -rf node_modules && npm install`

### Project page not loading
- Verify JSON file exists: `ls data/projects/`
- Check JSON syntax: `node -e "require('./data/projects/your-project.json')"`
- Check browser console for errors (F12)
- Verify ID in URL matches filename

### Images not appearing
- Check paths relative to `/public/assets/`
- Verify files exist: `ls public/assets/projects/<project-id>/`
- Check image extensions (.jpg, .jpeg, .png)
- Look for 404s in browser Network tab

### Search not working
- Check server is running: `curl http://localhost:3000/api/search?q=test`
- Verify embeddings generated
- Check console for model loading errors
- Restart server to reload data

---

## Performance Optimization

### Images
- Optimize images before adding (< 500KB recommended)
- Use JPG for photos, PNG for graphics
- Consider WebP for better compression
- Lazy load gallery images (already implemented)

### Embeddings
- Pre-compute all embeddings (don't generate on-the-fly)
- Cache popular queries
- Consider vector database for scale (>1000 items)

### Frontend
- Minimize CSS/JS (production builds)
- Use CDN for fonts/assets
- Enable gzip compression
- Add service worker for offline

---

## Future Roadmap

### Content Management
- [ ] Visual project editor (GUI)
- [ ] Bulk import from existing portfolio
- [ ] Project templates library
- [ ] Media asset management

### Search
- [ ] Advanced filters (year, tags, medium)
- [ ] Visual similarity search ("find similar images")
- [ ] Multi-language support
- [ ] Saved searches

### UI/UX
- [ ] Dark mode toggle
- [ ] Customizable color schemes
- [ ] Animation preferences
- [ ] Accessibility improvements (WCAG AA)

### Technical
- [ ] Migrate to React (optional)
- [ ] Vector database integration
- [ ] Fine-tuned embedding models
- [ ] Analytics dashboard

---

## Support

### Documentation
- [Content Management Guide](./CONTENT_MANAGEMENT.md)
- [Embeddings Guide](./EMBEDDINGS_GUIDE.md)
- [JSON Schema](../data/projects/schema.json)

### Examples
- [Sample Project](../data/projects/sample-project.json)
- View live: `/project.html?id=sample-project`

### Code
- Frontend: `/public/client.js`, `/public/js/project-loader.js`
- Backend: `/server/server.js`
- Styles: `/public/css/`

---

## License & Credits

**Project**: Guccione Browser
**Created**: 2024-2025
**Tech Stack**: Node.js, Express, Transformers.js, Vanilla JS
**Design Inspiration**: jnackash.com, shuangli.info, shuangcai.cargo.site
**Models**: CLIP (OpenAI), MiniLM (Sentence Transformers)

---

**Last Updated**: 2025-11-17
**Version**: 1.0
**Status**: Active Development
