// server/server.js - Main server file
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const imageSearch = require('./image-search');
const textEmbeddings = require('./text-embeddings');
const workSearch = require('./work-search');

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

// Load image embeddings and captions (for image search)
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
  console.error('Error loading image data:', error);
  mergedData = [];
}

// Load works data (for work search)
let worksData = [];
let worksCategories = [];
try {
  // Try to load works with embeddings first
  const worksWithEmbeddingsPath = path.join(__dirname, '../data/works-with-embeddings.json');
  const worksPath = path.join(__dirname, '../data/works.json');
  
  let worksFile = worksWithEmbeddingsPath;
  if (!fs.existsSync(worksWithEmbeddingsPath)) {
    console.log('Works with embeddings not found, using base works file');
    worksFile = worksPath;
  }
  
  if (fs.existsSync(worksFile)) {
    const worksContent = fs.readFileSync(worksFile, 'utf8');
    const worksJson = JSON.parse(worksContent);
    worksData = worksJson.works || [];
    worksCategories = worksJson.categories || [];
    
    console.log(`Loaded ${worksData.length} works from ${worksFile}`);
    console.log(`Loaded ${worksCategories.length} work categories`);
    
    // Convert embeddings from object format to array format if needed
    worksData = worksData.map(work => {
      if (work.textEmbedding && typeof work.textEmbedding === 'object' && !Array.isArray(work.textEmbedding)) {
        // Convert object to array
        const embeddingArray = Object.keys(work.textEmbedding)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => work.textEmbedding[key]);
        work.textEmbedding = embeddingArray;
      }
      
      if (work.imageEmbeddings && Array.isArray(work.imageEmbeddings)) {
        work.imageEmbeddings = work.imageEmbeddings.map(embedding => {
          if (typeof embedding === 'object' && !Array.isArray(embedding)) {
            // Convert object to array
            return Object.keys(embedding)
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map(key => embedding[key]);
          }
          return embedding;
        });
      }
      
      return work;
    });
    
    // Check if works have embeddings
    const worksWithEmbeddings = worksData.filter(work => work.textEmbedding).length;
    console.log(`Works with text embeddings: ${worksWithEmbeddings}/${worksData.length}`);
  } else {
    console.log('No works file found');
  }
} catch (error) {
  console.error('Error loading works data:', error);
  worksData = [];
  worksCategories = [];
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

// API endpoint for searching works (new primary search)
app.post('/api/search/works', async (req, res) => {
  try {
    const { query, searchType = 'multimodal', maxResults = 20 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Add query to search history if text model is loaded
    if (textModelLoaded) {
      textEmbeddings.addSearchToHistory(query);
    }
    
    // If no works data is loaded, return empty results
    if (worksData.length === 0) {
      console.log('No works data available, returning empty results');
      return res.json({ results: [] });
    }
    
    let results = [];
    
    if (searchType === 'multimodal') {
      results = await workSearch.searchMultimodal(query, worksData, { maxResults });
    } else if (searchType === 'text') {
      results = await workSearch.searchText(query, worksData, { maxResults });
    } else {
      return res.status(400).json({ error: 'Invalid search type. Use "multimodal" or "text"' });
    }
    
    // Format results for frontend
    const formattedResults = results.map(result => ({
      id: result.work.id,
      title: result.work.title,
      description: result.work.description,
      year: result.work.year,
      medium: result.work.medium,
      url: result.work.url,
      thumbnailImage: result.work.thumbnailImage,
      category: result.work.category,
      tags: result.work.tags,
      featured: result.work.featured,
      score: result.score,
      textScore: result.textScore,
      imageScore: result.imageScore
    }));
    
    res.json({ 
      results: formattedResults,
      searchType,
      query,
      totalResults: formattedResults.length
    });
  } catch (error) {
    console.error('Work search error:', error);
    res.status(500).json({ error: 'An error occurred during work search' });
  }
});

// API endpoint for searching images (legacy)
app.post('/api/search/images', async (req, res) => {
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
      console.log('No image data available, returning empty results');
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
    console.error('Image search error:', error);
    res.status(500).json({ error: 'An error occurred during image search' });
  }
});

// Update main search endpoint to default to works
app.post('/api/search', async (req, res) => {
  try {
    const { query, searchType = 'multimodal', maxResults = 20 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Add query to search history if text model is loaded
    if (textModelLoaded) {
      textEmbeddings.addSearchToHistory(query);
    }
    
    // If no works data is loaded, return empty results
    if (worksData.length === 0) {
      console.log('No works data available, returning empty results');
      return res.json({ results: [] });
    }
    
    let results = [];
    
    if (searchType === 'multimodal') {
      results = await workSearch.searchMultimodal(query, worksData, { maxResults });
    } else if (searchType === 'text') {
      results = await workSearch.searchText(query, worksData, { maxResults });
    } else {
      return res.status(400).json({ error: 'Invalid search type. Use "multimodal" or "text"' });
    }
    
    // Format results for frontend
    const formattedResults = results.map(result => ({
      id: result.work.id,
      title: result.work.title,
      description: result.work.description,
      year: result.work.year,
      medium: result.work.medium,
      url: result.work.url,
      thumbnailImage: result.work.thumbnailImage,
      category: result.work.category,
      tags: result.work.tags,
      featured: result.work.featured,
      score: result.score,
      textScore: result.textScore,
      imageScore: result.imageScore
    }));
    
    res.json({ 
      results: formattedResults,
      searchType,
      query,
      totalResults: formattedResults.length
    });
  } catch (error) {
    console.error('Work search error:', error);
    res.status(500).json({ error: 'An error occurred during work search' });
  }
});

// API endpoints for works data
app.get('/api/works', (req, res) => {
  try {
    const { category, year, medium, featured, status } = req.query;
    
    let filteredWorks = [...worksData];
    
    // Apply filters
    if (category) {
      filteredWorks = filteredWorks.filter(work => work.category === category);
    }
    
    if (year) {
      filteredWorks = filteredWorks.filter(work => work.year === year);
    }
    
    if (medium) {
      filteredWorks = filteredWorks.filter(work => {
        if (Array.isArray(work.medium)) {
          return work.medium.some(m => m.toLowerCase().includes(medium.toLowerCase()));
        }
        return work.medium && work.medium.toLowerCase().includes(medium.toLowerCase());
      });
    }
    
    if (featured !== undefined) {
      filteredWorks = filteredWorks.filter(work => work.featured === (featured === 'true'));
    }
    
    if (status) {
      filteredWorks = filteredWorks.filter(work => work.status === status);
    }
    
    res.json({ 
      works: filteredWorks,
      total: filteredWorks.length,
      categories: worksCategories
    });
  } catch (error) {
    console.error('Error fetching works:', error);
    res.status(500).json({ error: 'An error occurred while fetching works' });
  }
});

app.get('/api/works/:id', (req, res) => {
  try {
    const work = workSearch.getWorkById(req.params.id, worksData);
    
    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }
    
    res.json({ work });
  } catch (error) {
    console.error('Error fetching work:', error);
    res.status(500).json({ error: 'An error occurred while fetching the work' });
  }
});

app.get('/api/categories', (req, res) => {
  try {
    res.json({ categories: worksCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'An error occurred while fetching categories' });
  }
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    modelLoaded: modelLoaded,
    textModelLoaded: textModelLoaded,
    imageDataLoaded: mergedData.length > 0,
    worksDataLoaded: worksData.length > 0,
    totalWorks: worksData.length,
    totalImages: mergedData.length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});