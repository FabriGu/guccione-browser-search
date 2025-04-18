// This file handles loading the CLIP model and computing text embeddings
const path = require('path');
let transformers;

async function initialize() {
  // Import the transformers library
  transformers = await import('@huggingface/transformers');
  
  // Initialize tokenizer and text model
  global.tokenizer = await transformers.AutoTokenizer.from_pretrained(
    "Xenova/clip-vit-base-patch16"
  );
  
  global.textModel = await transformers.CLIPTextModelWithProjection.from_pretrained(
    "Xenova/clip-vit-base-patch16"
  );
  
  console.log("Models loaded successfully");
}

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

module.exports = {
  initialize,
  computeTextEmbedding,
  search
};