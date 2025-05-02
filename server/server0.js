// server/server.js - With improved error handling
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as imageSearch from './image-search.js';
import * as textEmbeddings from './text-embeddings.js';


// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Add error logging middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred' });
});

// Load image embeddings and captions
let mergedData = [];
try {
  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    console.log(`Creating data directory: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Check for embeddings file
  const embeddingsPath = path.join(__dirname, '../data/image-embeddings.json');
  const captionsPath = path.join(__dirname, '../data/image-captions.json');
  
  if (!fs.existsSync(embeddingsPath)) {
    console.error(`Embeddings file not found: ${embeddingsPath}`);
  } else {
    // Load embeddings
    const embeddingsData = fs.readFileSync(embeddingsPath, 'utf8');
    const imageEmbeddings = JSON.parse(embeddingsData).images;
    console.log(`Loaded ${imageEmbeddings.length} image embeddings`);
    
    // Check for captions file
    if (!fs.existsSync(captionsPath)) {
      console.error(`Captions file not found: ${captionsPath}`);
      // Use embeddings without captions
      mergedData = imageEmbeddings.map(embedding => ({
        ...embedding,
        caption: ''
      }));
      console.log(`Using ${mergedData.length} embeddings without captions`);
    } else {
      // Load captions
      const captionData = fs.readFileSync(captionsPath, 'utf8');
      const imageCaptions = JSON.parse(captionData).images;
      console.log(`Loaded ${imageCaptions.length} image captions`);
      
      // Merge embeddings and captions by URL
      mergedData = imageEmbeddings.map(embedding => {
        const matchedCaption = imageCaptions.find(caption => caption.url === embedding.url);
        return {
          ...embedding,
          caption: matchedCaption ? matchedCaption.caption : ''
        };
      });
      
      console.log(`Merged ${mergedData.length} items with embeddings and captions`);
    }
  }
} catch (error) {
  console.error('Error loading data:', error);
  // Create a fallback dataset - empty array
  mergedData = [];
}

// Initialize the embedding service (CLIP model only)
let modelLoaded = false;
let textModelLoaded = false;
/////////---------------------------------------------------------------------------OLD INITIALIZATION
// imageSearch.initialize()
//   .then((success) => {
//     modelLoaded = success;
//     console.log('CLIP model initialization completed, success:', success);
//   })
//   .catch(error => {
//     console.error('Failed to load CLIP model:', error);
//     modelLoaded = false;
//   });

Promise.all([
  imageSearch.initialize(),
  textEmbeddings.initialize()
])
.then(([imageSuccess, textSuccess]) => {
  modelLoaded = imageSuccess;
  textModelLoaded = textSuccess;
  console.log('Models initialization completed:', 
              'CLIP:', imageSuccess, 
              'Text embeddings:', textSuccess);
  
  // Initialize default search history if text model loaded successfully
  if (textSuccess) {
    textEmbeddings.initializeWithDefaultSearches();
  }
  // if (textModelLoaded) {
  //   // Validate the search history file structure
  //   textEmbeddings.validateSearchHistory();
    
  //   // Initialize with default searches if needed
  //   textEmbeddings.initializeWithDefaultSearches().then(() => {
  //     console.log("Search suggestions ready");
  //   });
  // }
})
.catch(error => {
  console.error('Failed to load models:', error);
  modelLoaded = false;
  textModelLoaded = false;
});

// Add this right after your Promise.all for model initialization

// // Ensure we have a working suggestion mechanism regardless of model loading
// if (!textModelLoaded) {
//   console.log('Setting up fallback suggestion mechanism since text model failed to load');
  
//   // Override getSuggestions to use a simple prefix matching mechanism
//   textEmbeddings.getSuggestions = async function(query, limit = 5) {
//     console.log(`Using fallback prefix matching for: "${query}"`);
    
//     if (!query || query.trim() === '') {
//       return [];
//     }
    
//     // Normalize query
//     query = query.trim().toLowerCase();
    
//     // Load search history
//     const history = textEmbeddings.loadSearchHistory();
    
//     // Handle empty history
//     if (!history.searches || history.searches.length === 0) {
//       return [];
//     }
    
//     // Simple prefix matching - find items that start with the query
//     const prefixMatches = history.searches
//       .filter(item => item.query.toLowerCase().startsWith(query))
//       .map(item => ({
//         query: item.query,
//         score: 1.0,
//         count: item.count || 1
//       }));
    
//     // If not enough prefix matches, find items that include the query
//     if (prefixMatches.length < limit) {
//       const containsMatches = history.searches
//         .filter(item => 
//           !item.query.toLowerCase().startsWith(query) && 
//           item.query.toLowerCase().includes(query)
//         )
//         .map(item => ({
//           query: item.query,
//           score: 0.8,  // Lower score for contains matches
//           count: item.count || 1
//         }));
      
//       // Combine and sort by score then count
//       const allMatches = [...prefixMatches, ...containsMatches]
//         .sort((a, b) => {
//           if (a.score !== b.score) return b.score - a.score;
//           return b.count - a.count;
//         });
      
//       return allMatches.slice(0, limit);
//     }
    
//     // Sort by count (popularity) for prefix matches
//     return prefixMatches
//       .sort((a, b) => b.count - a.count)
//       .slice(0, limit);
//   };
  
//   // Also override addSearchToHistory to not compute embeddings
//   textEmbeddings.addSearchToHistory = async function(query) {
//     if (!query || query.trim() === '') return false;
    
//     // Clean up the query
//     query = query.trim();
//     console.log(`Adding search to history (fallback mode): "${query}"`);
    
//     // Load current history
//     const history = textEmbeddings.loadSearchHistory();
    
//     // Check if this query already exists
//     const existingIndex = history.searches.findIndex(item => 
//       item.query.toLowerCase() === query.toLowerCase()
//     );
    
//     if (existingIndex >= 0) {
//       // Update the count for existing query
//       history.searches[existingIndex].count = (history.searches[existingIndex].count || 1) + 1;
//       history.searches[existingIndex].lastUsed = new Date().toISOString();
//       textEmbeddings.saveSearchHistory(history);
//       return true;
//     }
    
//     // Add new search to history (without embedding)
//     history.searches.push({
//       query: query,
//       embedding: null,  // No embedding in fallback mode
//       count: 1,
//       lastUsed: new Date().toISOString(),
//       created: new Date().toISOString()
//     });
    
//     textEmbeddings.saveSearchHistory(history);
//     return true;
//   };
  
//   console.log('Fallback suggestion mechanism is ready');
// }

// // Similarly, ensure we have a working search mechanism
// if (!modelLoaded) {
//   console.log('Setting up fallback search mechanism since CLIP model failed to load');
  
//   // Override search to use simple text matching
//   imageSearch.search = async function(query, imageItems) {
//     console.log(`Using fallback text matching for: "${query}"`);
    
//     const normalizedQuery = query.toLowerCase();
//     const queryTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 2);
    
//     // Calculate a simple matching score based on caption text
//     const matches = imageItems.map(item => {
//       let similarity = 0;
      
//       if (item.caption) {
//         const normalizedCaption = item.caption.toLowerCase();
        
//         // Check for exact phrase match
//         if (normalizedCaption.includes(normalizedQuery)) {
//           similarity += 2;
//         }
        
//         // Check for individual term matches
//         queryTerms.forEach(term => {
//           if (normalizedCaption.includes(term)) {
//             similarity += 0.5;
//           }
//         });
//       }
      
//       return { item, similarity };
//     });
    
//     // Sort by similarity score
//     return matches.sort((a, b) => b.similarity - a.similarity);
//   };
  
//   console.log('Fallback search mechanism is ready');
// }

// API endpoint for searching images
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (textModelLoaded) {
      textEmbeddings.addSearchToHistory(query);
    }

    // Add "photo of" to the query for better results
    const fullQuery = "photo of " + query.trim();
    
    // If no data is loaded, return empty results
    if (mergedData.length === 0) {
      console.log('No data available, returning empty results');
      return res.json({ results: [] });
    }
    
    // Get search results
    const results = await imageSearch.search(fullQuery, mergedData);
    
    // Return top 20 results with URLs, captions, and similarity scores
    const topResults = results.slice(0, 20).map(result => ({
      url: result.item.url,
      id: result.item.id,
      similarity: result.similarity,
      caption: result.item.caption || ''
    }));
    
    res.json({ results: topResults });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'An error occurred during search: ' + error.message });
  }
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    modelLoaded: modelLoaded,
    dataLoaded: mergedData.length > 0,
    environment: process.env.NODE_ENV || 'development'
  });
});
////////// ----------------------------------------------------------------------------new endpoing
app.get('/api/suggestions', async (req, res) => {
  try {
    const { query } = req.query;
    console.log(`Suggestion request received for: "${query}"`);
    
    if (!query) {
      console.log("Empty query, returning empty suggestions");
      return res.json({ suggestions: [] });
    }
    
    // Get suggestions using text embeddings
    console.log(`Getting suggestions for: "${query}"`);
    const suggestions = await textEmbeddings.getSuggestions(query);
    
    console.log(`Returning ${suggestions.length} suggestions:`, 
                suggestions.map(s => s.query).join(', '));
    
    res.json({ suggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'An error occurred while getting suggestions' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});