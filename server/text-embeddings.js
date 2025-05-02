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
        // Add debug output
        console.log("Loading search history from:", SEARCH_HISTORY_FILE);
        
        const data = fs.readFileSync(SEARCH_HISTORY_FILE, 'utf8');
        const history = JSON.parse(data);
        
        // Log the number of items found
        console.log(`Loaded ${history.searches?.length || 0} search items from history`);
        
        return history;
      } else {
        console.log("Search history file not found. Creating empty history.");
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
    console.log(`Adding search to history: "${query}"`);
    
    // Load current history
    const history = loadSearchHistory();
    
    // Check if this query already exists
    const existingIndex = history.searches.findIndex(item => 
      item.query.toLowerCase() === query.toLowerCase()
    );
    
    if (existingIndex >= 0) {
      // Update the count for existing query
      history.searches[existingIndex].count = (history.searches[existingIndex].count || 1) + 1;
      history.searches[existingIndex].lastUsed = new Date().toISOString();
      console.log(`Updating existing search: "${query}" (count: ${history.searches[existingIndex].count})`);
      saveSearchHistory(history);
      return true;
    }
    
    // Compute embedding for the new query
    console.log(`Computing embedding for new search: "${query}"`);
    const embedding = await computeEmbedding(query);
    
    // Add new search to history
    history.searches.push({
      query: query,
      embedding: embedding,
      count: 1,
      lastUsed: new Date().toISOString(),
      created: new Date().toISOString()
    });
    
    console.log(`Added new search to history: "${query}" (total: ${history.searches.length})`);
    
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
    query = query.trim().toLowerCase();
    
    // Load search history (ensuring we get the latest data)
    const history = loadSearchHistory();
    
    // If no history, return empty suggestions
    if (!history.searches || history.searches.length === 0) {
      console.log("No search history available for suggestions");
      return [];
    }
    
    console.log(`Finding suggestions for "${query}" among ${history.searches.length} items`);
    
    // Check for exact prefix matches first (better user experience for partial typing)
    const prefixMatches = history.searches
      .filter(item => item.query.toLowerCase().startsWith(query))
      .map(item => ({
        query: item.query,
        score: 1.0,  // Give prefix matches a perfect score
        count: item.count || 1
      }));
    
    // If we have enough prefix matches, return those
    if (prefixMatches.length >= limit) {
      console.log(`Found ${prefixMatches.length} prefix matches for "${query}"`);
      // Sort by count (popularity) for matches with same prefix
      return prefixMatches
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    }
    
    // If not enough prefix matches, compute embedding for the input query
    const queryEmbedding = await computeEmbedding(query);
    
    // Calculate similarity for each search in history
    const similarities = history.searches.map(item => {
      // Skip items without embeddings
      if (!item.embedding) {
        console.log(`Warning: Search item "${item.query}" has no embedding`);
        return { query: item.query, similarity: 0, count: item.count || 1 };
      }
      
      return {
        query: item.query,
        similarity: cosineSimilarity(queryEmbedding, item.embedding),
        count: item.count || 1
      };
    });
    
    // Combine prefix matches with semantic matches
    const allMatches = [
      ...prefixMatches,
      ...similarities.filter(item => 
        !prefixMatches.some(match => match.query === item.query)
      )
    ];
    
    // Sort by similarity (highest first)
    allMatches.sort((a, b) => b.similarity - a.similarity);
    
    // Log what we found
    console.log(`Found ${allMatches.length} total matches, returning top ${limit}`);
    
    // Return top N suggestions
    return allMatches.slice(0, limit).map(item => ({
      query: item.query,
      score: item.similarity,
      count: item.count || 1
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

function validateSearchHistory() {
    console.log("Validating search history file...");
    try {
      // Check if file exists
      if (!fs.existsSync(SEARCH_HISTORY_FILE)) {
        console.log("Search history file doesn't exist. Creating a new one.");
        fs.writeFileSync(SEARCH_HISTORY_FILE, JSON.stringify({ searches: [] }, null, 2));
        return false;
      }
      
      // Read the file
      const data = fs.readFileSync(SEARCH_HISTORY_FILE, 'utf8');
      let history;
      
      try {
        // Parse the JSON
        history = JSON.parse(data);
      } catch (parseError) {
        console.error("Error parsing search history JSON:", parseError);
        console.log("Creating a new search history file with valid JSON");
        fs.writeFileSync(SEARCH_HISTORY_FILE, JSON.stringify({ searches: [] }, null, 2));
        return false;
      }
      
      // Check if history has the expected structure
      if (!history || !Array.isArray(history.searches)) {
        console.error("Invalid search history structure. Resetting file.");
        fs.writeFileSync(SEARCH_HISTORY_FILE, JSON.stringify({ searches: [] }, null, 2));
        return false;
      }
      
      // Check each search item for valid structure
      let hasInvalidItems = false;
      const validSearches = history.searches.filter(item => {
        if (!item || typeof item !== 'object') {
          hasInvalidItems = true;
          return false;
        }
        
        if (!item.query || typeof item.query !== 'string') {
          hasInvalidItems = true;
          return false;
        }
        
        if (!item.embedding || !Array.isArray(item.embedding)) {
          console.log(`Search item "${item.query}" has no valid embedding`);
          hasInvalidItems = true;
          return false;
        }
        
        return true;
      });
      
      // If any items were invalid, update the file
      if (hasInvalidItems) {
        console.log(`Removed ${history.searches.length - validSearches.length} invalid items from search history`);
        fs.writeFileSync(SEARCH_HISTORY_FILE, JSON.stringify({ searches: validSearches }, null, 2));
        return false;
      }
      
      console.log(`Search history validated: ${history.searches.length} valid items`);
      return true;
    } catch (error) {
      console.error("Error validating search history:", error);
      return false;
    }
  }

export { 
  initialize, 
  computeEmbedding, 
  cosineSimilarity, 
  loadSearchHistory, 
  saveSearchHistory, 
  addSearchToHistory, 
  getSuggestions,
  initializeWithDefaultSearches,
  validateSearchHistory
};

