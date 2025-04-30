

// async function initialize() {
//   // Import the transformers library
//   transformers = await import('@huggingface/transformers');

//    // Set custom cache directory
//    process.env.TRANSFORMERS_CACHE = path.join(__dirname, '../models/huggingface');
//    console.log("Using custom models directory:", process.env.TRANSFORMERS_CACHE);
//     // Initialize tokenizer and text model with local path
//   global.tokenizer = await transformers.AutoTokenizer.from_pretrained(
//     "Xenova/clip-vit-base-patch16",
//     { local_files_only: true, cache_dir: process.env.TRANSFORMERS_CACHE }
//   );
  
//   global.textModel = await transformers.CLIPTextModelWithProjection.from_pretrained(
//     "Xenova/clip-vit-base-patch16",
//     { local_files_only: true, cache_dir: process.env.TRANSFORMERS_CACHE }
//   );
  
//   // // Initialize tokenizer and text model
//   // global.tokenizer = await transformers.AutoTokenizer.from_pretrained(
//   //   "Xenova/clip-vit-base-patch16"
//   // );
  
//   // global.textModel = await transformers.CLIPTextModelWithProjection.from_pretrained(
//   //   "Xenova/clip-vit-base-patch16"
//   // );
  
//   console.log("Models loaded successfully");
// }
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory if needed
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, '../models/huggingface');

// Initialize transformers
let transformers;

// Configure the environment
process.env.TRANSFORMERS_CACHE = MODELS_DIR;
console.log("Using models directory:", MODELS_DIR);

async function initialize() {
  try {
    console.log("Starting to initialize image search...");
    console.log("TRANSFORMERS_CACHE:", process.env.TRANSFORMERS_CACHE);
    
    // Import the transformers library
    transformers = await import('@huggingface/transformers');
    console.log("Transformers library imported");
    
    // Set any custom pipeline options
    const pipelineOptions = {
      local_files_only: false, // Change to false to allow downloads if needed
      cache_dir: MODELS_DIR,
    };
    
    console.log("Loading tokenizer with options:", JSON.stringify(pipelineOptions));
    console.log("From model path:", "Xenova/clip-vit-base-patch16");
    
    // Try to load the tokenizer
    global.tokenizer = await transformers.AutoTokenizer.from_pretrained(
      "Xenova/clip-vit-base-patch16",
      pipelineOptions
    );
    console.log("Tokenizer loaded successfully");
    
    // Try to load the text model
    console.log("Loading text model...");
    global.textModel = await transformers.CLIPTextModelWithProjection.from_pretrained(
      "Xenova/clip-vit-base-patch16",
      pipelineOptions
    );
    console.log("Text model loaded successfully");
    
    return true;
  } catch (error) {
    console.error("Failed to load models:", error);
    console.error("Error stack:", error.stack);
    
    // Create fallback
    global.mockEmbedding = true;
    console.log("Using fallback random embeddings");
    return false;
  }
}

// Rest of your code remains the same

async function computeTextEmbedding(query) {
  // Compute text embedding
  const textInputs = global.tokenizer([query], { padding: true, truncation: true });
  const { text_embeds } = await global.textModel(textInputs);
  return text_embeds.normalize().tolist()[0];
}

// Cosine similarity function
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

async function search(query, imageEmbeddings) {
  // Compute embedding for the query
  const textEmbedding = await computeTextEmbedding(query);
  
  // Calculate similarities
  const similarities = imageEmbeddings.map(item => {
    if (!item.embedding) return { item, similarity: 0 };
    const similarity = cosineSimilarity(textEmbedding, item.embedding);
    return { item, similarity };
  });
  
  // Sort by similarity (highest first)
  return similarities.sort((a, b) => b.similarity - a.similarity);
}

// Export functions using ES modules syntax
export { initialize, computeTextEmbedding, search };