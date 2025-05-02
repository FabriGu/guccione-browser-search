// server/image-search.js - Using standard model approach
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, '../models/huggingface');

// Set up transformers to use local models
let transformers;
let tokenizer = null;
let textModel = null;

// Initialize model
async function initialize() {
  try {
    console.log("Initializing CLIP model...");
    
    // Set environment variables
    process.env.TRANSFORMERS_CACHE = MODELS_DIR;
    
    // Import the transformers library
    transformers = await import('@huggingface/transformers');
    
    const modelOptions = {
      cache_dir: MODELS_DIR,
      local_files_only: false, // Allow downloading if needed
      quantized: false, // Use non-quantized model for better compatibility
      progress_callback: progress => {
        if (progress.status === 'progress' && progress.progress % 10 === 0) {
          console.log(`Model download progress: ${progress.progress.toFixed(0)}%`);
        }
      }
    };
    
    // Load tokenizer using standard options
    console.log("Loading tokenizer...");
    tokenizer = await transformers.AutoTokenizer.from_pretrained(
      "Xenova/clip-vit-base-patch16",
      modelOptions
    );
    console.log("Tokenizer loaded successfully");
    
    // Load text model using standard options
    console.log("Loading text model...");
    textModel = await transformers.CLIPTextModelWithProjection.from_pretrained(
      "Xenova/clip-vit-base-patch16",
      modelOptions
    );
    console.log("Text model loaded successfully");
    
    console.log("CLIP models loaded successfully");
    return true;
  } catch (error) {
    console.error("Failed to load CLIP models:", error);
    return false;
  }
}

// Compute text embedding for search query
async function computeTextEmbedding(query) {
  try {
    if (!tokenizer || !textModel) {
      throw new Error("Models not initialized");
    }
    
    const textInputs = tokenizer([query], { padding: true, truncation: true });
    const { text_embeds } = await textModel(textInputs);
    return text_embeds.normalize().tolist()[0];
  } catch (error) {
    console.error("Error computing text embedding:", error);
    // Return a zero vector as fallback
    return Array(512).fill(0);
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
    
    // Just return items in original order if search fails
    return imageItems.map(item => ({
      item,
      similarity: 0.5 // Neutral similarity
    }));
  }
}

export { initialize, computeTextEmbedding, search };