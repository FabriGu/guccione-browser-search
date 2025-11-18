# Embeddings & Search Index Guide

Guide for generating and managing embeddings for the Guccione Browser semantic search system.

## Overview

Guccione Browser uses AI embeddings for zero-shot semantic search:

- **Text Search (Works)**: MiniLM-L6-v2 embeddings for project descriptions
- **Image Search**: CLIP-ViT-Base-Patch16 embeddings for visual content
- **Autocomplete**: Pre-computed query embeddings for suggestions

## Architecture

```
User Query → Embedding Model → Vector → Similarity Search → Ranked Results
```

### Text Search Flow
1. User enters query text
2. MiniLM computes query embedding (384-dim vector)
3. Backend compares with stored project embeddings (cosine similarity)
4. Returns ranked results (70% text similarity, 30% image similarity)

### Image Search Flow
1. User enters visual query
2. CLIP text encoder computes query embedding (512-dim vector)
3. Backend compares with stored image embeddings
4. Returns ranked images with metadata

---

## Models Used

### 1. MiniLM-L6-v2 (Text Embeddings)
- **Model**: `Xenova/all-MiniLM-L6-v2`
- **Dimension**: 384
- **Purpose**: Semantic text search for project descriptions
- **Performance**: Fast, efficient for short texts

### 2. CLIP-ViT-Base-Patch16 (Image Embeddings)
- **Model**: `Xenova/clip-vit-base-patch16`
- **Dimension**: 512
- **Purpose**: Semantic image search and multi-modal matching
- **Performance**: Good for general visual concepts

---

## Adding New Project Content

### For Text Search

When you add a new project JSON file, the backend needs to index it:

1. **Create project JSON** (see CONTENT_MANAGEMENT.md)
2. **Restart server** - Backend loads projects on startup
3. **Test search** - Query should return your new project

**Backend automatically**:
- Loads project JSON files from `/data/projects/`
- Computes MiniLM embeddings for descriptions
- Stores embeddings in memory for fast search

### For Image Search

When you add new project images, generate CLIP embeddings:

1. **Add images** to `/public/assets/projects/<project-id>/`
2. **Update gallery** in project JSON with image paths
3. **Generate embeddings** (see below)
4. **Restart server** to load new embeddings

---

## Generating Image Embeddings

### Option 1: Backend Script (Recommended)

If your backend has an embedding generation script:

```bash
# Navigate to server directory
cd server

# Run embedding generator
node generate-image-embeddings.js

# Script will:
# - Scan /public/assets/projects/ for images
# - Load CLIP model
# - Compute embeddings for each image
# - Save to embeddings file/database
```

### Option 2: Manual Python Script

Create a Python script using transformers:

```python
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch
import json
import os

# Load CLIP model
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch16")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch16")

# Directory containing project images
images_dir = "../public/assets/projects/"

embeddings = {}

# Iterate through project directories
for project_id in os.listdir(images_dir):
    project_path = os.path.join(images_dir, project_id)
    if not os.path.isdir(project_path):
        continue

    for image_file in os.listdir(project_path):
        if image_file.endswith(('.jpg', '.jpeg', '.png')):
            image_path = os.path.join(project_path, image_file)

            # Load and process image
            image = Image.open(image_path)
            inputs = processor(images=image, return_tensors="pt")

            # Generate embedding
            with torch.no_grad():
                image_features = model.get_image_features(**inputs)
                embedding = image_features[0].numpy().tolist()

            # Store embedding
            relative_path = f"projects/{project_id}/{image_file}"
            embeddings[relative_path] = embedding

            print(f"Generated embedding for {relative_path}")

# Save embeddings
with open("../data/image-embeddings.json", "w") as f:
    json.dump(embeddings, f)

print(f"Saved {len(embeddings)} image embeddings")
```

Run the script:
```bash
python generate_clip_embeddings.py
```

### Option 3: Client-Side Generation (Development Only)

For testing, you can compute embeddings in browser (slow):

```javascript
// Using Transformers.js (already in your backend)
import { pipeline } from '@xenova/transformers';

async function generateImageEmbedding(imageUrl) {
  const extractor = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch16');
  const output = await extractor(imageUrl);
  return output.data;
}
```

**Note**: Only use for development. Production should pre-compute embeddings.

---

## Autocomplete Suggestions

The autocomplete system uses pre-computed query embeddings stored in `/data/search-history.json`.

### Structure
```json
{
  "suggestions": [
    {
      "query": "algorithmic portraits",
      "embedding": [0.123, -0.456, ...],  // 384-dim MiniLM vector
      "count": 5,                          // Number of times searched
      "lastSearched": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Adding Custom Suggestions

1. **Search for the query** - System auto-saves to search history
2. **Or manually add** to search-history.json:

```json
{
  "query": "your custom suggestion",
  "embedding": null,  // Will be computed on next server restart
  "count": 1,
  "lastSearched": "2025-01-17T00:00:00Z"
}
```

3. **Restart server** - Computes missing embeddings

### Clearing Search History

```bash
# Backup first
cp data/search-history.json data/search-history.backup.json

# Clear (keep structure)
echo '{"suggestions":[]}' > data/search-history.json

# Restart server
npm run dev
```

---

## Optimizing Search Performance

### Embedding Storage

**Current**: In-memory (fast, but requires restart)

**Scalable options**:
1. **Vector Database**: Pinecone, Weaviate, Milvus
2. **Traditional DB with vector extension**: PostgreSQL + pgvector
3. **Redis with vector similarity**: RedisSearch

### Similarity Search

**Current**: Cosine similarity in memory

**Optimizations**:
1. **Approximate Nearest Neighbors (ANN)**: FAISS, Annoy
2. **Indexing**: Build vector index for faster search
3. **Caching**: Cache popular queries

### Batch Processing

Generate embeddings in batches for efficiency:

```javascript
// Batch size of 32 images
const BATCH_SIZE = 32;

async function generateEmbeddingsBatch(imagePaths) {
  const batches = chunk(imagePaths, BATCH_SIZE);

  for (const batch of batches) {
    const embeddings = await Promise.all(
      batch.map(path => generateEmbedding(path))
    );
    saveEmbeddings(batch, embeddings);
  }
}
```

---

## Embedding Best Practices

### 1. Consistent Preprocessing
- **Images**: Same size/normalization as training (224x224 for CLIP)
- **Text**: Lowercase, remove special chars if needed
- **Normalization**: L2 normalize vectors for cosine similarity

### 2. Quality Over Quantity
- Use high-quality project descriptions
- Include relevant keywords naturally
- Add rich captions to images

### 3. Regular Updates
- Regenerate embeddings when content changes significantly
- Update model versions periodically for improvements

### 4. Testing
```javascript
// Test embedding quality
async function testEmbedding() {
  const query = "algorithmic art";
  const results = await searchWorks(query);

  console.log("Top results:");
  results.slice(0, 5).forEach((r, i) => {
    console.log(`${i+1}. ${r.title} (score: ${r.score})`);
  });
}
```

---

## Troubleshooting

### Embeddings not generating
- Check model is downloading correctly (first run can be slow)
- Verify sufficient disk space for model cache (~500MB per model)
- Check Node.js version (>= 16 recommended)

### Search returning irrelevant results
- Regenerate embeddings with fresh content
- Check description quality (vague descriptions = poor results)
- Verify embedding dimensions match (384 for MiniLM, 512 for CLIP)

### Slow search performance
- Pre-compute all embeddings (don't generate on-the-fly)
- Consider vector database for large collections (>1000 items)
- Cache frequent queries
- Use approximate nearest neighbors (ANN) algorithms

### Out of memory errors
- Reduce batch size when generating
- Use smaller model variant if needed
- Clear Node.js cache: `rm -rf node_modules/.cache`

---

## Advanced: Custom Models

To use different embedding models:

### 1. Update Model Name

In `server/server.js` (or wherever models are loaded):

```javascript
// Replace MiniLM
const textExtractor = await pipeline(
  'feature-extraction',
  'sentence-transformers/all-mpnet-base-v2'  // Better quality, slower
);

// Replace CLIP
const imageExtractor = await pipeline(
  'feature-extraction',
  'openai/clip-vit-large-patch14'  // Better quality, slower
);
```

### 2. Regenerate Embeddings

All existing embeddings must be regenerated with new model.

### 3. Update Dimensions

If dimensions change, update comparison logic:

```javascript
// Check embedding dimensions match
if (queryEmbedding.length !== storedEmbedding.length) {
  throw new Error('Embedding dimension mismatch');
}
```

---

## Future Enhancements

1. **Fine-tuning**: Train models on your specific portfolio content
2. **Multi-modal fusion**: Combine text + image embeddings for hybrid search
3. **Relevance feedback**: Learn from user clicks to improve ranking
4. **Semantic filtering**: Filter by project type, year, tags using embeddings
5. **Visual similarity**: "Find similar images" feature

---

## Resources

- **Transformers.js Docs**: https://huggingface.co/docs/transformers.js
- **CLIP Paper**: https://arxiv.org/abs/2103.00020
- **Sentence Transformers**: https://www.sbert.net/
- **Vector Databases**: https://www.pinecone.io/learn/vector-database/

---

**Last Updated**: 2025-11-17
**Models**: MiniLM-L6-v2, CLIP-ViT-Base-Patch16
