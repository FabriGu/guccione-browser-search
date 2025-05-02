// server/server.js - With improved error handling
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as imageSearch from './image-search.js';

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
imageSearch.initialize()
  .then((success) => {
    modelLoaded = success;
    console.log('CLIP model initialization completed, success:', success);
  })
  .catch(error => {
    console.error('Failed to load CLIP model:', error);
    modelLoaded = false;
  });

// API endpoint for searching images
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});