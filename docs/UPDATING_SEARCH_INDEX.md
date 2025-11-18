# Updating Search Index - Complete Guide

How to make your new projects searchable in the Guccione Browser.

## Overview

You have **3 new projects** in `/data/projects/`:
- `112.json` (1+1≠2)
- `CollectiveComposite.json`
- `SpokenWardrobe.json`

To make them searchable, you need to:
1. **Add projects to works index** (for text search)
2. **Generate text embeddings** (for semantic search)
3. **Add images to image catalog** (for image search)
4. **Generate image embeddings** (for visual search)
5. **Restart server** to load new data

---

## Current System Architecture

### Works Search (Text-based)
- **Data**: `/data/works.json` or `/data/works-with-embeddings.json`
- **Model**: MiniLM-L6-v2 (384-dim embeddings)
- **Search**: Semantic similarity on project descriptions
- **Loaded**: On server startup

### Image Search (Visual)
- **Data**: `/data/image-embeddings.json` + `/data/image-captions.json`
- **Model**: CLIP-ViT-Base-Patch16 (512-dim embeddings)
- **Search**: Visual similarity + caption matching
- **Loaded**: On server startup

---

## Step-by-Step Process

### Part 1: Add Projects to Works Index

#### 1.1 Open works.json
```bash
code data/works.json
```

#### 1.2 Add your projects

Based on your project JSONs, add entries like this:

```json
{
  "works": [
    ... existing works ...
    ,
    {
      "id": "112",
      "title": "1+1≠2",
      "description": "A collection of two pieces that explore the intersection of fashion and technology in unexpected ways.",
      "year": "2023",
      "medium": ["Wearable", "Electronics", "3D Printing", "Sewing"],
      "status": "completed",
      "textContent": "This project stems from my obsession with combining fashion and technology. The two pieces in the collection aim to showcase that often innovation is forced into fashion and generates articles of clothing that can be inconvenient to wear and provide no additional functionality. I designed and sewed the pieces myself, created 3D printed custom parts and mechanisms for the project, as well as put together all the electronic components and the code that made them function.",
      "tags": ["design", "interactive", "wearable", "electronics", "3D printing", "sewing", "code"],
      "images": [
        "projects/112/FrontShotPieces.png",
        "projects/112/bagSide.jpg",
        "projects/112/hat1.jpg",
        "projects/112/wearingBagSide.png"
      ],
      "thumbnailImage": "projects/112/FrontShotPieces.png",
      "category": "physical_computing",
      "url": "/project.html?id=112",
      "featured": false,
      "embedding": null,
      "textEmbedding": null,
      "imageEmbeddings": []
    },
    {
      "id": "CollectiveComposite",
      "title": "Collective Composite",
      "description": "A demonstration project showcasing the minimalist template system for Guccione Browser portfolio pages",
      "year": "2024",
      "medium": ["Design", "Interactive", "Web"],
      "status": "completed",
      "textContent": "This is a sample project demonstrating the flexible JSON-driven template system for Guccione Browser portfolio pages. The system draws inspiration from minimalist portfolio designs while providing maximum flexibility for customization. Each project can have its own unique theme, color palette, typography, and layout configuration. The grid-based positioning system allows for sophisticated layouts while maintaining simplicity and ease of content management.",
      "tags": ["design", "interactive", "web"],
      "images": [
        "projects/CollectiveComposite/Grid.jpg"
      ],
      "thumbnailImage": "projects/CollectiveComposite/Grid.jpg",
      "category": "digital_art",
      "url": "/project.html?id=CollectiveComposite",
      "featured": false,
      "embedding": null,
      "textEmbedding": null,
      "imageEmbeddings": []
    },
    {
      "id": "SpokenWardrobe",
      "title": "Spoken Wardrobe",
      "description": "Interactive wearable project exploring voice-controlled fashion technology",
      "year": "2024",
      "medium": ["Wearable", "Interactive", "Voice"],
      "status": "completed",
      "textContent": "Spoken Wardrobe is an interactive wearable project that explores the intersection of voice technology and fashion. The piece responds to voice commands and creates a unique interaction between the wearer and their clothing.",
      "tags": ["wearable", "voice", "interactive", "fashion", "technology"],
      "images": [
        "projects/SpokenWardrobe/main.jpg"
      ],
      "thumbnailImage": "projects/SpokenWardrobe/main.jpg",
      "category": "physical_computing",
      "url": "/project.html?id=SpokenWardrobe",
      "featured": false,
      "embedding": null,
      "textEmbedding": null,
      "imageEmbeddings": []
    }
  ],
  "categories": [
    ... existing categories ...
  ]
}
```

**Important fields:**
- `id`: Must match your project JSON filename (without .json)
- `url`: Use `/project.html?id=your-id` format
- `textContent`: Detailed description for better search results
- `images`: Array of image paths (use normalized format: `projects/id/image.jpg`)
- `embedding`, `textEmbedding`, `imageEmbeddings`: Leave as null for now

---

### Part 2: Generate Text Embeddings

You have two options: **Manual** or **Script-based**

#### Option A: Manual Script (Recommended)

Create `/server/generate-text-embeddings.js`:

```javascript
const fs = require('fs');
const path = require('path');

// Set environment
process.env.TRANSFORMERS_CACHE = path.join(__dirname, '../models/huggingface');

async function generateWorkEmbeddings() {
  console.log('Loading transformers library...');
  const { pipeline } = await import('@huggingface/transformers');

  console.log('Loading MiniLM model...');
  const extractor = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  );

  console.log('Loading works.json...');
  const worksPath = path.join(__dirname, '../data/works.json');
  const works = JSON.parse(fs.readFileSync(worksPath, 'utf8'));

  console.log(`Processing ${works.works.length} works...`);

  for (let i = 0; i < works.works.length; i++) {
    const work = works.works[i];
    console.log(`[${i + 1}/${works.works.length}] ${work.title}`);

    // Generate embedding from textContent or description
    const text = work.textContent || work.description;
    const output = await extractor(text, {
      pooling: 'mean',
      normalize: true
    });

    // Store embedding
    work.textEmbedding = Array.from(output.data);

    console.log(`  ✓ Generated ${work.textEmbedding.length}-dim embedding`);
  }

  // Save to works-with-embeddings.json
  const outputPath = path.join(__dirname, '../data/works-with-embeddings.json');
  fs.writeFileSync(outputPath, JSON.stringify(works, null, 2));

  console.log(`\n✅ Done! Saved to ${outputPath}`);
  console.log(`Generated embeddings for ${works.works.length} works`);
}

// Run
generateWorkEmbeddings().catch(console.error);
```

**Run it:**
```bash
node server/generate-text-embeddings.js
```

**Expected output:**
```
Loading transformers library...
Loading MiniLM model...
Loading works.json...
Processing 7 works...
[1/7] Digital Identity Series
  ✓ Generated 384-dim embedding
[2/7] Memory Palace Installation
  ✓ Generated 384-dim embedding
...
[7/7] Spoken Wardrobe
  ✓ Generated 384-dim embedding

✅ Done! Saved to data/works-with-embeddings.json
```

#### Option B: Server Auto-generates on Startup

The server already handles missing embeddings! It will:
1. Load `works-with-embeddings.json` (or `works.json`)
2. Check each work for `textEmbedding`
3. Generate embeddings for works without them
4. Keep them in memory (doesn't save back to file)

**To use this:**
1. Just add your projects to `works.json` with `textEmbedding: null`
2. Restart the server
3. Server logs will show: "Generating text embedding for work: 1+1≠2"

**Note:** Embeddings are only stored in memory with this approach. Use Option A to save them permanently.

---

### Part 3: Add Images to Image Catalog

#### 3.1 Check existing image-catalog.json structure

```bash
cat data/image-catalog.json | head -20
```

You should see:
```json
{
  "images": [
    {
      "id": "0",
      "url": "images/filename.jpg"
    },
    ...
  ]
}
```

#### 3.2 Add your project images

You need to add ALL project images to the catalog:

```json
{
  "images": [
    ... existing images ...
    ,
    {
      "id": "74",
      "url": "projects/112/FrontShotPieces.png"
    },
    {
      "id": "75",
      "url": "projects/112/bagSide.jpg"
    },
    {
      "id": "76",
      "url": "projects/112/hat1.jpg"
    },
    {
      "id": "77",
      "url": "projects/112/wearingBagSide.png"
    },
    {
      "id": "78",
      "url": "projects/CollectiveComposite/Grid.jpg"
    },
    {
      "id": "79",
      "url": "projects/SpokenWardrobe/main.jpg"
    }
  ]
}
```

**Important:**
- IDs must be unique and sequential
- Check the last existing ID (probably 73) and start from there
- Use normalized paths: `projects/project-id/image.jpg`

---

### Part 4: Generate Image Embeddings

You need to create a script similar to the caption generator but for CLIP embeddings.

#### 4.1 Create generate-image-embeddings.js

```javascript
// server/generate-image-embeddings.js
const express = require('express');
const path = require('path');
const fs = require('fs');

// Set environment
process.env.TRANSFORMERS_CACHE = path.join(__dirname, '../models/huggingface');

const PORT = 3002;
const __dirname_root = path.join(__dirname, '..');

async function loadImageCatalog() {
  const catalogPath = path.join(__dirname_root, 'data/image-catalog.json');
  console.log(`Loading catalog from: ${catalogPath}`);
  const rawData = fs.readFileSync(catalogPath, 'utf8');
  return JSON.parse(rawData).images;
}

async function startServer() {
  console.log('Starting image embedding generator...');

  const app = express();
  app.use('/public', express.static(path.join(__dirname_root, 'public')));
  app.use('/assets', express.static(path.join(__dirname_root, 'public/assets')));

  const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    processImages()
      .then(() => {
        console.log('Processing complete. Shutting down...');
        server.close();
      })
      .catch(error => {
        console.error('Error:', error);
        server.close();
      });
  });
}

async function processImages() {
  console.log('Loading CLIP model...');
  const { AutoProcessor, CLIPVisionModelWithProjection, RawImage } =
    await import('@huggingface/transformers');

  const model = await CLIPVisionModelWithProjection.from_pretrained(
    'Xenova/clip-vit-base-patch16'
  );
  const processor = await AutoProcessor.from_pretrained(
    'Xenova/clip-vit-base-patch16'
  );

  console.log('CLIP model loaded successfully');

  const imageItems = await loadImageCatalog();
  console.log(`Found ${imageItems.length} images in catalog`);

  const result = { images: [] };

  for (const [index, item] of imageItems.entries()) {
    try {
      console.log(`[${index + 1}/${imageItems.length}] ${item.url}`);

      // Load image
      const imageUrl = `http://localhost:${PORT}/assets/${item.url}`;
      const image = await RawImage.fromURL(imageUrl);

      // Process image
      const image_inputs = await processor(image);

      // Generate embedding
      const { image_embeds } = await model(image_inputs);
      const embedding = Array.from(image_embeds.data);

      console.log(`  ✓ Generated ${embedding.length}-dim embedding`);

      result.images.push({
        id: item.id,
        url: item.url,
        embedding: embedding
      });

      // Save progress every 10 images
      if (index % 10 === 9 || index === imageItems.length - 1) {
        const outputPath = path.join(__dirname_root, 'data/image-embeddings.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`Progress saved (${index + 1}/${imageItems.length})`);
      }

    } catch (error) {
      console.error(`Error processing ${item.url}: ${error.message}`);
    }
  }

  const outputPath = path.join(__dirname_root, 'data/image-embeddings.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`✅ Done! Embeddings saved to ${outputPath}`);
}

startServer().catch(console.error);
```

#### 4.2 Run the script

```bash
node server/generate-image-embeddings.js
```

**Expected output:**
```
Starting image embedding generator...
Server running at http://localhost:3002
Loading CLIP model...
CLIP model loaded successfully
Found 80 images in catalog
[1/80] projects/112/FrontShotPieces.png
  ✓ Generated 512-dim embedding
[2/80] projects/112/bagSide.jpg
  ✓ Generated 512-dim embedding
...
Progress saved (10/80)
...
✅ Done! Embeddings saved to data/image-embeddings.json
```

**Note:** This will take a while (~5-10 seconds per image). Be patient!

---

### Part 5: Generate Image Captions (Optional but Recommended)

Captions improve search quality by adding text descriptions to images.

#### 5.1 Run existing caption generator

```bash
node server/generate-captions.js
```

This will:
1. Load Florence-2 model (first time takes a while to download)
2. Generate captions for all images in catalog
3. Save to `data/image-captions.json`

**Note:** This is **very slow** (~10-20 seconds per image). You can skip this initially and add it later.

---

### Part 6: Restart Server

Once you've generated embeddings:

```bash
# Kill existing server
lsof -ti:3000 | xargs kill -9

# Restart
npm run dev
```

**Check server logs:**
```
Loaded 80 image embeddings
Loaded 80 image captions
Merged 80 items with embeddings and captions
Loaded 7 works from data/works-with-embeddings.json
Works with text embeddings: 7/7
```

---

## Testing Your Changes

### Test Works Search

```bash
# Search for your project
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "wearable fashion technology"}'
```

Should return your "1+1≠2" project!

### Test Image Search

```bash
# Search for images
curl -X POST http://localhost:3000/api/search/images \
  -H "Content-Type: application/json" \
  -d '{"query": "clothing bag accessory"}'
```

Should return images from your projects!

### Test in Browser

1. Go to `http://localhost:3000`
2. Search "wearable technology" - Should see 1+1≠2 project
3. Click "Images" tab
4. Search "bag" - Should see your bagSide.jpg image

---

## Quick Reference Commands

```bash
# Add projects to works.json (manual edit)
code data/works.json

# Generate text embeddings
node server/generate-text-embeddings.js

# Add images to catalog (manual edit)
code data/image-catalog.json

# Generate image embeddings
node server/generate-image-embeddings.js

# Generate captions (optional)
node server/generate-captions.js

# Restart server
lsof -ti:3000 | xargs kill -9 && npm run dev

# Test works search
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "your search term"}'

# Test image search
curl -X POST http://localhost:3000/api/search/images \
  -H "Content-Type: application/json" \
  -d '{"query": "your search term"}'
```

---

## Troubleshooting

### "Model not found" error
The first time you run embedding scripts, they download models (~500MB). This can take 10-20 minutes. Be patient!

### "No images found in catalog"
Check that `data/image-catalog.json` exists and has the correct structure.

### "Works not showing in search"
1. Check `data/works-with-embeddings.json` has your projects
2. Verify `textEmbedding` is not null
3. Restart server to reload data

### "Images not showing in search"
1. Check `data/image-catalog.json` has your images
2. Verify `data/image-embeddings.json` has embeddings for them
3. Check image paths match (use normalized format)
4. Restart server

### "Out of memory" errors
Reduce batch size or process images one at a time. The embedding models are memory-intensive.

---

## File Checklist

Before deploying, make sure these files are updated:

- [ ] `data/works.json` - Added your 3 new projects
- [ ] `data/works-with-embeddings.json` - Has text embeddings for all works
- [ ] `data/image-catalog.json` - Added all 6 new project images
- [ ] `data/image-embeddings.json` - Has CLIP embeddings for all images
- [ ] `data/image-captions.json` - Has captions for all images (optional)
- [ ] Server restarted and logs show correct counts

---

## Deployment

Once everything works locally:

```bash
# Commit all data files
git add data/works-with-embeddings.json
git add data/image-catalog.json
git add data/image-embeddings.json
git add data/image-captions.json
git add data/projects/*.json

# Commit
git commit -m "Add new projects: 112, CollectiveComposite, SpokenWardrobe with embeddings"

# Push (auto-deploys to Digital Ocean)
git push origin main
```

Digital Ocean will automatically pull changes and restart the server.

---

**Last Updated**: 2025-11-17
**Related Docs**: EMBEDDINGS_GUIDE.md, CONTENT_MANAGEMENT.md
