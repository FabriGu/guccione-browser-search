// server/image-search.js - Simplified version
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, '../models/huggingface');

// Set up transformers to use local models
let transformers;
process.env.TRANSFORMERS_CACHE = MODELS_DIR;
console.log("Using models directory:", MODELS_DIR);

async function initialize() {
  try {
    console.log("Initializing CLIP model...");
    
    // Import the transformers library
    transformers = await import('@huggingface/transformers');
    
    // Load models from local cache
    global.tokenizer = await transformers.AutoTokenizer.from_pretrained(
      "Xenova/clip-vit-base-patch16",
      { cache_dir: MODELS_DIR }
    );
    
    global.textModel = await transformers.CLIPTextModelWithProjection.from_pretrained(
      "Xenova/clip-vit-base-patch16",
      { cache_dir: MODELS_DIR }
    );
    
    console.log("CLIP models loaded successfully");
    return true;
  } catch (error) {
    console.error("Failed to load CLIP models:", error);
    return false;
  }
}

// Compute text embedding for search query
async function computeTextEmbedding(query) {
  const textInputs = global.tokenizer([query], { padding: true, truncation: true });
  const { text_embeds } = await global.textModel(textInputs);
  return text_embeds.normalize().tolist()[0];
}

// Calculate cosine similarity between query and image embeddings
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (normA * normB);
}

// Search function that compares query embedding to image embeddings
async function search(query, imageItems) {
  const textEmbedding = await computeTextEmbedding(query);
  
  const similarities = imageItems.map(item => {
    if (!item.embedding) return { item, similarity: 0 };
    const similarity = cosineSimilarity(textEmbedding, item.embedding);
    return { item, similarity };
  });
  
  return similarities.sort((a, b) => b.similarity - a.similarity);
}

export { initialize, computeTextEmbedding, search };