// server/image-search.js - With better error handling
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, '../models/huggingface');

// Create models directory if it doesn't exist
if (!fs.existsSync(MODELS_DIR)) {
  console.log(`Creating models directory: ${MODELS_DIR}`);
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

// Set up transformers to use local models
let transformers;
process.env.TRANSFORMERS_CACHE = MODELS_DIR;
console.log("Using models directory:", MODELS_DIR);

async function initialize() {
  try {
    console.log("Initializing CLIP model...");
    
    // Import the transformers library
    transformers = await import('@huggingface/transformers');
    console.log("Transformers library imported successfully");
    
    // Configure model loading options
    const modelOptions = { 
      cache_dir: MODELS_DIR,
      local_files_only: process.env.NODE_ENV === 'production' ? false : true 
    };
    console.log("Model loading options:", JSON.stringify(modelOptions));
    
    try {
      // Load tokenizer
      console.log("Loading tokenizer...");
      global.tokenizer = await transformers.AutoTokenizer.from_pretrained(
        "Xenova/clip-vit-base-patch16",
        modelOptions
      );
      console.log("Tokenizer loaded successfully");
    } catch (tokenError) {
      console.error("Failed to load tokenizer:", tokenError);
      throw new Error("Failed to load tokenizer: " + tokenError.message);
    }
    
    try {
      // Load text model
      console.log("Loading text model...");
      global.textModel = await transformers.CLIPTextModelWithProjection.from_pretrained(
        "Xenova/clip-vit-base-patch16",
        modelOptions
      );
      console.log("Text model loaded successfully");
    } catch (modelError) {
      console.error("Failed to load text model:", modelError);
      throw new Error("Failed to load text model: " + modelError.message);
    }
    
    console.log("CLIP models loaded successfully");
    return true;
  } catch (error) {
    console.error("Failed to load CLIP models:", error);
    
    // Create fallback functionality for production
    console.log("Setting up fallback search functionality");
    global.mockSearch = true;
    
    // Define mock search functions
    global.mockTextEmbedding = () => Array(512).fill(0).map(() => Math.random() - 0.5);
    
    return false;
  }
}

// Compute text embedding for search query
async function computeTextEmbedding(query) {
  // If in fallback mode, use mock embedding
  if (global.mockSearch) {
    console.log("Using mock text embedding for query:", query);
    return global.mockTextEmbedding();
  }
  
  try {
    const textInputs = global.tokenizer([query], { padding: true, truncation: true });
    const { text_embeds } = await global.textModel(textInputs);
    return text_embeds.normalize().tolist()[0];
  } catch (error) {
    console.error("Error computing text embedding:", error);
    
    // Use fallback in case of error
    console.log("Falling back to mock embedding");
    global.mockSearch = true;
    return global.mockTextEmbedding();
  }
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
  try {
    const textEmbedding = await computeTextEmbedding(query);
    
    const similarities = imageItems.map(item => {
      if (!item.embedding) return { item, similarity: 0 };
      const similarity = cosineSimilarity(textEmbedding, item.embedding);
      return { item, similarity };
    });
    
    return similarities.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error("Error during search:", error);
    
    // Fallback: just return items in original order with random similarity
    return imageItems.map(item => ({
      item,
      similarity: Math.random()
    })).sort((a, b) => b.similarity - a.similarity);
  }
}

export { initialize, computeTextEmbedding, search };