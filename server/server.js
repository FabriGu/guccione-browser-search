// server/server.js - Main server file
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const imageSearch = require('./image-search');
const textEmbeddings = require('./text-embeddings');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Create necessary directories
const modelsDir = path.join(__dirname, '../models/huggingface');
const dataDir = path.join(__dirname, '../data');

if (!fs.existsSync(modelsDir)) {
  console.log(`Creating models directory: ${modelsDir}`);
  fs.mkdirSync(modelsDir, { recursive: true });
}

if (!fs.existsSync(dataDir)) {
  console.log(`Creating data directory: ${dataDir}`);
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load image embeddings and captions
let mergedData = [];
try {
  // Load embeddings
  const embeddingsPath = path.join(__dirname, '../data/image-embeddings.json');
  if (!fs.existsSync(embeddingsPath)) {
    console.error(`Embeddings file not found: ${embeddingsPath}`);
  } else {
    const embeddingsData = fs.readFileSync(embeddingsPath, 'utf8');
    const imageEmbeddings = JSON.parse(embeddingsData).images;
    console.log(`Loaded ${imageEmbeddings.length} image embeddings`);
    
    // Check for captions file
    const captionsPath = path.join(__dirname, '../data/image-captions.json');
    if (!fs.existsSync(captionsPath)) {
      console.log(`Captions file not found: ${captionsPath}`);
      // Use embeddings without captions
      mergedData = imageEmbeddings.map(embedding => ({
        ...embedding,
        caption: ''
      }));
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
  mergedData = [];
}

// Initialize models
let modelLoaded = false;
let textModelLoaded = false;

// Initialize the models separately
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
  
  // Initialize search history if text model loaded
  if (textSuccess) {
    textEmbeddings.initializeWithDefaultSearches();
  }
})
.catch(error => {
  console.error('Error initializing models:', error);
});

// API endpoint for searching images
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Add query to search history if text model is loaded
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
    res.status(500).json({ error: 'An error occurred during search' });
  }
});

// API endpoint for search suggestions
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
    
    console.log(`Returning ${suggestions.length} suggestions`);
    
    res.json({ suggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'An error occurred while getting suggestions' });
  }
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    modelLoaded: modelLoaded,
    textModelLoaded: textModelLoaded,
    dataLoaded: mergedData.length > 0
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});