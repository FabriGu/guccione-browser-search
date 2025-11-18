# New Project Workflow - Simplified!

**Single source of truth**: Your project JSONs are now the only place you need to add content.

## Quick Start

### 1. Add Your Project JSON
```bash
# Create new project file
cp data/projects/_templates/sample-project.json data/projects/my-new-project.json

# Edit with your content
code data/projects/my-new-project.json
```

### 2. Add Your Images
```bash
# Create project image folder
mkdir -p public/assets/projects/my-new-project

# Add your images there
cp ~/path/to/images/* public/assets/projects/my-new-project/
```

### 3. Rebuild Search Index
```bash
# One command rebuilds everything!
node server/rebuild-search-index.js
```

This will:
- ✅ Build works.json from all project JSONs
- ✅ Generate text embeddings (MiniLM)
- ✅ Build image-catalog.json from all project JSONs
- ✅ Generate image embeddings (CLIP)

**Time:** 30-60 minutes first run (model downloads), then 5-10 minutes per project.

### 4. Restart Server
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### 5. Test!
```
http://localhost:3000
```

Search for your project - it should appear in both Works and Images search!

---

## What Changed?

### ❌ Old Way (Manual)
1. Create project JSON in `data/projects/`
2. **Manually** add entry to `data/works.json` (duplicate data!)
3. **Manually** add images to `data/image-catalog.json` (duplicate data!)
4. Generate text embeddings
5. Generate image embeddings

### ✅ New Way (Automatic)
1. Create project JSON in `data/projects/`
2. Run `node server/rebuild-search-index.js`
3. Done!

**Benefits:**
- No duplicate data entry
- Can't forget to update works.json
- Can't have mismatches between project and works
- Single source of truth

---

## Project JSON Structure

Your project JSON already contains everything needed for search:

```json
{
  "id": "my-project",
  "title": "My Project",
  "description": "Short description for search results",
  "year": "2024",
  "tags": ["tag1", "tag2"],
  "thumbnail": "projects/my-project/thumb.jpg",

  "content": {
    "hero": {
      "image": "projects/my-project/hero.jpg"  // Optional
    },
    "overview": {
      "longDescription": "Detailed text for semantic search"
    },
    "gallery": {
      "images": [
        { "src": "projects/my-project/image1.jpg" },
        { "src": "projects/my-project/image2.jpg" }
      ]
    }
  }
}
```

**The scripts extract:**
- `title`, `description`, `year`, `tags` → works index
- `longDescription` → text embeddings
- All images (thumbnail, hero, gallery) → image catalog → image embeddings

---

## Scripts Explained

### `build-works-index.js`
Reads all `data/projects/*.json` files and creates `data/works.json`.

**What it extracts:**
- Basic info: id, title, description, year
- Tags → medium & category
- All images (thumbnail, hero, gallery)
- Long description → textContent

**Run standalone:**
```bash
node server/build-works-index.js
```

### `build-image-catalog.js`
Reads all project JSONs and creates `data/image-catalog.json`.

**What it extracts:**
- thumbnail
- hero.image
- gallery.images[].src

**Handles:**
- Deduplication (same image in multiple projects)
- Path normalization (removes `public/assets/`, leading slashes, etc.)

**Run standalone:**
```bash
node server/build-image-catalog.js
```

### `generate-text-embeddings.js`
Generates MiniLM embeddings for all works.

**Smart features:**
- Skips works that already have embeddings
- Only re-generates new/changed works

**Run standalone:**
```bash
node server/generate-text-embeddings.js
```

### `generate-image-embeddings.js`
Generates CLIP embeddings for all images in catalog.

**Smart features:**
- Preserves existing embeddings
- Only generates for new images
- Saves progress every 10 images

**Run standalone:**
```bash
node server/generate-image-embeddings.js
```

### `rebuild-search-index.js` (Master Script)
Runs all 4 scripts in sequence. Use this when adding new projects.

```bash
node server/rebuild-search-index.js
```

---

## Incremental Updates

### Adding a single new project
```bash
# Add project JSON
code data/projects/new-project.json

# Rebuild (only generates embeddings for new project)
node server/rebuild-search-index.js
```

The scripts are smart - they won't regenerate embeddings for existing projects!

### Updating an existing project
```bash
# Edit project
code data/projects/my-project.json

# Rebuild works index
node server/build-works-index.js

# If you changed the description, regenerate text embedding
node server/generate-text-embeddings.js

# If you added images, rebuild catalog and embeddings
node server/build-image-catalog.js
node server/generate-image-embeddings.js
```

---

## File Organization

```
data/
  projects/
    _templates/          # Templates (excluded from indexing)
      sample-project.json
      schema.json
    112.json             # ✅ Indexed
    CollectiveComposite.json  # ✅ Indexed
    SpokenWardrobe.json       # ✅ Indexed

  works.json             # Auto-generated from projects/
  works-with-embeddings.json  # Auto-generated with embeddings
  image-catalog.json     # Auto-generated from projects/
  image-embeddings.json  # Auto-generated with embeddings
```

**Rules:**
- Files/folders starting with `_` are ignored
- Only `.json` files at root of `projects/` are indexed
- Templates go in `_templates/`

---

## Testing

### Test works search
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "your project keywords"}'
```

### Test image search
```bash
curl -X POST http://localhost:3000/api/search/images \
  -H "Content-Type: application/json" \
  -d '{"query": "visual description"}'
```

### Test in browser
1. `http://localhost:3000`
2. Search for your project
3. Switch to Images tab
4. Search for image content

---

## Deployment

```bash
# Commit everything
git add data/projects/*.json
git add data/works-with-embeddings.json
git add data/image-catalog.json
git add data/image-embeddings.json

git commit -m "Add new project: My Project Name"
git push origin main
```

Digital Ocean auto-deploys and restarts server.

---

## Troubleshooting

### "No projects found"
- Check files are in `data/projects/` (not subdirectories)
- Check files end with `.json`
- Check files don't start with `_`

### "Models downloading slowly"
First run downloads ~700MB of models. Be patient! Subsequent runs use cached models.

### "Embeddings not updating"
Delete the old embeddings files and regenerate:
```bash
rm data/works-with-embeddings.json
rm data/image-embeddings.json
node server/rebuild-search-index.js
```

### "Out of memory"
Image embedding generation is memory-intensive. Close other applications or process images in smaller batches.

---

## Next Steps

1. **Move templates** (already done):
   ```bash
   # Already moved to _templates/
   data/projects/_templates/sample-project.json
   data/projects/_templates/schema.json
   ```

2. **Test the new workflow**:
   ```bash
   node server/rebuild-search-index.js
   ```

3. **Add your projects** - Just create JSON files in `data/projects/`!

---

**Last Updated**: 2025-11-17
**Architecture**: Single source of truth, auto-generated indexes
**Simplification**: 5 manual steps → 1 command
