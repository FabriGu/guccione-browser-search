// server/text-embeddings.js
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, '../models/huggingface');

// Default search history file
const SEARCH_HISTORY_FILE = path.join(__dirname, '../data/search-history.json');

// Set up transformers to use local models
let transformers;
process.env.TRANSFORMERS_CACHE = MODELS_DIR;

// Initialize model
async function initialize() {
  try {
    console.log("Initializing text embeddings model...");
    
    // Import the transformers library
    transformers = await import('@huggingface/transformers');
    
    // Load pipeline for feature extraction
    try {
      // First try with local_files_only to avoid downloading if already present
      global.textEmbeddingPipeline = await transformers.pipeline(
        "feature-extraction", 
        "Xenova/all-MiniLM-L6-v2", 
        { 
          cache_dir: MODELS_DIR,
          local_files_only: true 
        }
      );
      console.log("Loaded text embeddings model from local files");
    } catch (localError) {
      console.log("Local model not found, downloading from Hugging Face Hub...");
      global.textEmbeddingPipeline = await transformers.pipeline(
        "feature-extraction", 
        "Xenova/all-MiniLM-L6-v2", 
        { 
          cache_dir: MODELS_DIR,
          local_files_only: false // Allow downloading
        }
      );
      console.log("Downloaded and loaded text embeddings model");
    }
    
    console.log("Text embeddings model loaded successfully");
    return true;
  } catch (error) {
    console.error("Failed to load text embeddings model:", error);
    
    // Create fallback functionality
    console.log("Setting up fallback embedding functionality");
    global.mockTextEmbedding = true;
    
    // Define mock embedding function that returns a random vector
    global.mockEmbeddingFunction = () => Array(384).fill(0).map(() => Math.random() - 0.5);
    
    return false;
  }
}

// Compute text embedding for a query
async function computeEmbedding(text) {
  // If in fallback mode, use mock embedding
  if (global.mockTextEmbedding) {
    console.log("Using mock text embedding for:", text);
    return global.mockEmbeddingFunction();
  }
  
  try {
    const output = await global.textEmbeddingPipeline(text, { 
      pooling: "mean", 
      normalize: true 
    });
    return output.data;
  } catch (error) {
    console.error("Error computing text embedding:", error);
    
    // Use fallback in case of error
    console.log("Falling back to mock embedding");
    global.mockTextEmbedding = true;
    return global.mockEmbeddingFunction();
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (normA * normB);
}

// Load search history from file
function loadSearchHistory() {
  try {
    if (fs.existsSync(SEARCH_HISTORY_FILE)) {
      const data = fs.readFileSync(SEARCH_HISTORY_FILE, 'utf8');
      return JSON.parse(data);
    } else {
      // Initialize with empty history
      return { searches: [] };
    }
  } catch (error) {
    console.error("Error loading search history:", error);
    return { searches: [] };
  }
}

// Save search history to file
function saveSearchHistory(history) {
  try {
    fs.writeFileSync(SEARCH_HISTORY_FILE, JSON.stringify(history, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving search history:", error);
    return false;
  }
}

// Add a search to history
async function addSearchToHistory(query) {
  if (!query || query.trim() === '') return false;
  
  // Clean up the query
  query = query.trim();
  
  // Load current history
  const history = loadSearchHistory();
  
  // Check if this query already exists
  const existingIndex = history.searches.findIndex(item => 
    item.query.toLowerCase() === query.toLowerCase()
  );
  
  if (existingIndex >= 0) {
    // Update the count for existing query
    history.searches[existingIndex].count += 1;
    history.searches[existingIndex].lastUsed = new Date().toISOString();
    saveSearchHistory(history);
    return true;
  }
  
  // Compute embedding for the new query
  const embedding = await computeEmbedding(query);
  
  // Add new search to history
  history.searches.push({
    query: query,
    embedding: embedding,
    count: 1,
    lastUsed: new Date().toISOString(),
    created: new Date().toISOString()
  });
  
  // Save updated history
  saveSearchHistory(history);
  return true;
}

// Get search suggestions
async function getSuggestions(query, limit = 5) {
  if (!query || query.trim() === '') {
    return [];
  }
  
  // Clean up the query
  query = query.trim();
  
  // Load search history
  const history = loadSearchHistory();
  
  // If no history, return empty suggestions
  if (!history.searches || history.searches.length === 0) {
    return [];
  }
  
  // Compute embedding for the input query
  const queryEmbedding = await computeEmbedding(query);
  
  // Calculate similarity for each search in history
  const similarities = history.searches.map(item => {
    return {
      query: item.query,
      similarity: cosineSimilarity(queryEmbedding, item.embedding),
      count: item.count
    };
  });
  
  // Sort by similarity (highest first)
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  // Return top N suggestions
  return similarities.slice(0, limit).map(item => ({
    query: item.query,
    score: item.similarity,
    count: item.count
  }));
}

// Initialize with some default searches
async function initializeWithDefaultSearches() {
  // Check if we already have search history
  const history = loadSearchHistory();
  
  if (history.searches && history.searches.length > 0) {
    console.log("Search history already exists with", history.searches.length, "entries");
    return;
  }
  
  console.log("Initializing default search history...");
  
  // List of default searches
  const defaultSearches = [
    "person",
    "people",
    "family",
    "children",
    "boy",
    "girl",
    "man",
    "woman",
    "beach",
    "ocean",
    "mountain",
    "forest",
    "city",
    "dog",
    "cat",
    "animal",
    "sunset",
    "food",
    "car",
    "house",
    "building",
    "tree",
    "flower",
    "water",
    "sky"
  ];
  
  // Add each default search
  for (const search of defaultSearches) {
    await addSearchToHistory(search);
  }
  
  console.log("Default search history initialized with", defaultSearches.length, "entries");
}

export { 
  initialize, 
  computeEmbedding, 
  cosineSimilarity, 
  loadSearchHistory, 
  saveSearchHistory, 
  addSearchToHistory, 
  getSuggestions,
  initializeWithDefaultSearches
};