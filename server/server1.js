// server/server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as imageSearch from './image-search.js';
// import * as captionService from './caption-service.js';

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Load image embeddings
let imageEmbeddings = [];
try {
  const embeddingsData = fs.readFileSync(path.join(__dirname, '../data/image-embeddings.json'), 'utf8');
  imageEmbeddings = JSON.parse(embeddingsData).images;
  console.log(`Loaded ${imageEmbeddings.length} image embeddings`);
} catch (error) {
  console.error('Error loading embeddings:', error);
}

// Load image captions
// captionService.loadCaptions();

// Initialize the embedding service
imageSearch.initialize()
  .then(() => {
    console.log('CLIP model loaded successfully');
  })
  .catch(error => {
    console.error('Failed to load CLIP model:', error);
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
    
    // Get search results
    const results = await imageSearch.search(fullQuery, imageEmbeddings);
    
    // Return top 20 results with proper URLs and captions
    const topResults = results.slice(0, 20).map(result => ({
      url: result.item.url,
      id: result.item.id,
      similarity: result.similarity,
      caption: captionService.getCaption(result.item.id) || ''
    }));
    
    res.json({ results: topResults });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'An error occurred during search' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});