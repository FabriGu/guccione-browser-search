// server/image-search.js - Simple CommonJS version
const path = require('path');
const MODELS_DIR = path.join(__dirname, '../models/huggingface');

// Set up environment variables
process.env.TRANSFORMERS_CACHE = MODELS_DIR;

// Will store model objects
let tokenizer;
let textModel;
let transformers;

async function initialize() {
  try {
    console.log("Initializing CLIP model...");
    
    // Import the transformers library (must use dynamic import)
    transformers = await import('@huggingface/transformers');
    console.log("Transformers library imported successfully");
    
    // Initialize tokenizer and text model
    tokenizer = await transformers.AutoTokenizer.from_pretrained(
      "Xenova/clip-vit-base-patch16"
    );
    console.log("Tokenizer loaded successfully");
    
    textModel = await transformers.CLIPTextModelWithProjection.from_pretrained(
      "Xenova/clip-vit-base-patch16"
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
    const textInputs = tokenizer([query], { padding: true, truncation: true });
    const { text_embeds } = await textModel(textInputs);
    return text_embeds.normalize().tolist()[0];
  } catch (error) {
    console.error("Error computing text embedding:", error);
    return null;
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
    
    if (!textEmbedding) {
      // If embedding failed, just return the original order
      return imageItems.map(item => ({
        item, 
        similarity: 0
      }));
    }
    
    const similarities = imageItems.map(item => {
      if (!item.embedding) return { item, similarity: 0 };
      const similarity = cosineSimilarity(textEmbedding, item.embedding);
      return { item, similarity };
    });
    
    return similarities.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error("Error during search:", error);
    
    // Just return the original items if search fails
    return imageItems.map(item => ({
      item,
      similarity: 0
    }));
  }
}

module.exports = {
  initialize,
  computeTextEmbedding,
  search
};