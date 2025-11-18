# Quick Start: Making Your Projects Searchable

Follow these steps to add your new projects to the search index.

## You Have 3 New Projects
- `112.json` (1+1≠2) - 4 images
- `CollectiveComposite.json` - 1 image
- `SpokenWardrobe.json` - 1 image

## Steps (30-60 minutes total)

### Step 1: Add Projects to Works Index (5 min)

Edit `data/works.json` and add your projects:

```bash
code data/works.json
```

Copy the template from `docs/UPDATING_SEARCH_INDEX.md` (search for "Part 1").

**Key fields:**
- `id`: Match your project JSON filename (e.g., "112")
- `url`: `/project.html?id=your-id`
- `textContent`: Detailed description for better search
- `images`: Array of normalized paths (`projects/112/image.jpg`)

### Step 2: Generate Text Embeddings (10-15 min)

```bash
node server/generate-text-embeddings.js
```

**What it does:**
- Loads MiniLM model (downloads on first run, ~100MB)
- Generates 384-dim embeddings for each work's text
- Saves to `data/works-with-embeddings.json`

**Expected output:**
```
Generated: 3 new embeddings
Skipped: 4 (already had embeddings)
✅ Done!
```

### Step 3: Add Images to Catalog (5 min)

Edit `data/image-catalog.json`:

```bash
code data/image-catalog.json
```

Add entries for your 6 new images:

```json
{
  "id": "74",
  "url": "projects/112/FrontShotPieces.png"
},
{
  "id": "75",
  "url": "projects/112/bagSide.jpg"
},
...
```

**Note:** Find the last existing ID (probably 73) and continue from there.

### Step 4: Generate Image Embeddings (15-30 min)

```bash
node server/generate-image-embeddings.js
```

**What it does:**
- Loads CLIP model (downloads on first run, ~600MB)
- Generates 512-dim embeddings for each image
- Saves to `data/image-embeddings.json`
- Takes ~5-10 seconds per image

**Expected output:**
```
Generated: 6 new embeddings
Skipped: 74 (already existed)
✅ Done!
```

### Step 5: Restart Server

```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

Check logs show:
```
Loaded 80 image embeddings
Loaded 7 works from data/works-with-embeddings.json
Works with text embeddings: 7/7
```

### Step 6: Test It!

**Test works search:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "wearable fashion technology"}'
```

Should return your "1+1≠2" project!

**Test in browser:**
1. Go to `http://localhost:3000`
2. Search "wearable technology"
3. Should see your project in results!
4. Click "Images" tab, search "bag"
5. Should see your bagSide.jpg image!

---

## Optional: Generate Captions (30-60 min)

Improves image search quality but very slow:

```bash
node server/generate-captions.js
```

**Note:** Takes 10-20 seconds per image. Can skip for now.

---

## Files You'll Edit

- [ ] `data/works.json` - Add 3 new projects
- [ ] `data/image-catalog.json` - Add 6 new images

## Files Auto-generated

- [ ] `data/works-with-embeddings.json` - Created by Step 2
- [ ] `data/image-embeddings.json` - Created by Step 4

## Ready to Deploy?

```bash
git add data/works-with-embeddings.json
git add data/image-catalog.json
git add data/image-embeddings.json
git add data/projects/*.json

git commit -m "Add 3 new projects with embeddings"
git push origin main
```

---

## Troubleshooting

**"Model not found"**
First run downloads models (~700MB total). Be patient!

**"No images in catalog"**
Check `data/image-catalog.json` exists and has correct structure.

**"Works not showing"**
1. Check `data/works-with-embeddings.json` has your projects
2. Verify `textEmbedding` is not null (384 numbers)
3. Restart server

**"Images not showing"**
1. Check `data/image-embeddings.json` has embeddings (512 numbers)
2. Verify image paths are normalized: `projects/112/image.jpg`
3. Restart server

---

## Full Documentation

See `docs/UPDATING_SEARCH_INDEX.md` for complete details.

---

**Last Updated**: 2025-11-17
