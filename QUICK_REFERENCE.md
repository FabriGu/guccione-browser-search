# Quick Reference - Guccione Browser

## Adding a New Project (Simplified Workflow)

### 1. Create Project JSON
```bash
# Copy template
cp data/projects/_templates/sample-project.json data/projects/my-project.json

# Edit with your content
code data/projects/my-project.json
```

### 2. Add Images
```bash
# Create folder
mkdir -p public/assets/projects/my-project

# Add images
# Use paths in JSON: "projects/my-project/image.jpg"
```

### 3. Rebuild Search Index
```bash
# Option A: One command for everything
npm run rebuild

# Option B: Individual steps
npm run build:works      # Build works.json from projects
npm run embed:text       # Generate text embeddings
npm run build:images     # Build image catalog
npm run embed:images     # Generate image embeddings
```

### 4. Restart & Test
```bash
npm run dev
# Visit: http://localhost:3000
```

---

## NPM Scripts

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `npm run dev` | Start dev server | After any changes |
| `npm run rebuild` | Full rebuild (all 4 steps) | New project added |
| `npm run build:works` | Build works.json | Project JSON changed |
| `npm run build:images` | Build image catalog | Images added/removed |
| `npm run embed:text` | Generate text embeddings | Description changed |
| `npm run embed:images` | Generate image embeddings | New images added |

---

## File Structure

```
data/
  projects/
    _templates/        # Ignored by scripts
      sample-project.json
      schema.json
    my-project.json    # Your projects here!

  works.json           # Auto-generated
  works-with-embeddings.json  # Auto-generated
  image-catalog.json   # Auto-generated
  image-embeddings.json       # Auto-generated

public/
  assets/
    projects/
      my-project/      # Your images here!
        image1.jpg
        image2.jpg
```

---

## Project JSON Template

```json
{
  "id": "my-project",
  "title": "My Project",
  "year": "2024",
  "thumbnail": "projects/my-project/thumb.jpg",
  "description": "Short description",
  "tags": ["tag1", "tag2"],

  "theme": {
    "backgroundColor": "#ffffff",
    "accentColor": "#ff0000"
  },

  "content": {
    "hero": {
      "subtitle": "Tagline",
      "image": "projects/my-project/hero.jpg"
    },
    "overview": {
      "longDescription": "Detailed description for search",
      "metadata": {
        "role": "Your role",
        "technologies": ["Tech 1", "Tech 2"]
      }
    },
    "gallery": {
      "layout": "justified",
      "images": [
        {
          "src": "projects/my-project/img1.jpg",
          "caption": "Caption",
          "alt": "Alt text"
        }
      ]
    }
  }
}
```

---

## Testing

### Test Works Search
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "your keywords"}'
```

### Test Image Search
```bash
curl -X POST http://localhost:3000/api/search/images \
  -H "Content-Type: application/json" \
  -d '{"query": "visual description"}'
```

### In Browser
1. http://localhost:3000
2. Search for project
3. Click "Images" tab
4. Search for images

---

## Deployment

```bash
git add data/projects/my-project.json
git add public/assets/projects/my-project/
git add data/works-with-embeddings.json
git add data/image-embeddings.json

git commit -m "Add new project: My Project"
git push origin main
```

Digital Ocean auto-deploys.

---

## Troubleshooting

### No projects showing?
- Check file is in `data/projects/` (not subdirectory)
- Check file ends with `.json`
- Check file doesn't start with `_`
- Run `npm run build:works`

### Images not loading?
- Check images exist in `public/assets/projects/my-project/`
- Check paths in JSON: `projects/my-project/image.jpg`
- Check browser console for 404 errors

### Search not working?
- Run `npm run rebuild`
- Restart server: `npm run dev`
- Check server logs for errors

### Out of memory?
- Close other applications
- Image embeddings are memory-intensive
- Process smaller batches if needed

---

## Documentation

- `NEW_PROJECT_WORKFLOW.md` - Complete workflow guide
- `docs/CONTENT_MANAGEMENT.md` - Project JSON structure
- `docs/IMAGE_PATHS_REFERENCE.md` - Image path formats
- `docs/UPDATING_SEARCH_INDEX.md` - Original manual process (deprecated)

---

**Last Updated**: 2025-11-17
**Workflow**: Simplified single-source-of-truth
