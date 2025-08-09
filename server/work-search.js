// server/work-search.js - Multi-modal work search functionality
const path = require('path');
const textEmbeddings = require('./text-embeddings');
const imageSearch = require('./image-search');

// Calculate cosine similarity between two vectors
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

// Generate combined text for a work (for embedding)
function generateCombinedText(work) {
  const textParts = [
    work.title,
    work.description,
    work.textContent,
    work.medium ? (Array.isArray(work.medium) ? work.medium.join(' ') : work.medium) : '',
    work.tags ? work.tags.join(' ') : '',
    work.category || '',
    work.year || ''
  ];
  
  return textParts.filter(part => part && part.trim()).join(' ');
}

// Multi-modal search combining text and image similarities
async function searchMultimodal(query, works, options = {}) {
  try {
    const {
      textWeight = 0.7,
      imageWeight = 0.3,
      maxResults = 20,
      minSimilarity = 0.1
    } = options;

    console.log(`Starting multi-modal search for: "${query}"`);
    
    // Get embeddings for the query
    const [queryTextEmbedding, queryImageEmbedding] = await Promise.all([
      textEmbeddings.computeEmbedding(query),
      imageSearch.computeTextEmbedding(query)
    ]);

    if (!queryTextEmbedding && !queryImageEmbedding) {
      console.warn('Failed to compute embeddings for query');
      return works.map(work => ({ work, score: 0, textScore: 0, imageScore: 0 }));
    }

    // Score each work
    const scoredWorks = works.map(work => {
      let textScore = 0;
      let imageScore = 0;
      
      // Calculate text similarity
      if (queryTextEmbedding && work.textEmbedding) {
        textScore = cosineSimilarity(queryTextEmbedding, work.textEmbedding);
      }
      
      // Calculate image similarity (average across all work images)
      if (queryImageEmbedding && work.imageEmbeddings && work.imageEmbeddings.length > 0) {
        const imageScores = work.imageEmbeddings.map(imgEmbedding => 
          cosineSimilarity(queryImageEmbedding, imgEmbedding)
        );
        imageScore = imageScores.reduce((sum, score) => sum + score, 0) / imageScores.length;
      }
      
      // Combined weighted score
      const combinedScore = (textScore * textWeight) + (imageScore * imageWeight);
      
      return {
        work,
        score: combinedScore,
        textScore,
        imageScore
      };
    });
    
    // Filter by minimum similarity and sort by score
    const filteredResults = scoredWorks
      .filter(result => result.score >= minSimilarity)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    console.log(`Multi-modal search returned ${filteredResults.length} results`);
    
    return filteredResults;
  } catch (error) {
    console.error('Error in multi-modal search:', error);
    return works.map(work => ({ work, score: 0, textScore: 0, imageScore: 0 }));
  }
}

// Text-only search for faster queries
async function searchText(query, works, options = {}) {
  try {
    const { maxResults = 20, minSimilarity = 0.1 } = options;

    console.log(`Starting text search for: "${query}"`);
    
    const queryEmbedding = await textEmbeddings.computeEmbedding(query);
    
    if (!queryEmbedding) {
      console.warn('Failed to compute text embedding for query');
      return works.map(work => ({ work, score: 0, textScore: 0, imageScore: 0 }));
    }

    const scoredWorks = works.map(work => {
      let textScore = 0;
      
      if (work.textEmbedding) {
        textScore = cosineSimilarity(queryEmbedding, work.textEmbedding);
      }
      
      return {
        work,
        score: textScore,
        textScore,
        imageScore: 0
      };
    });
    
    const filteredResults = scoredWorks
      .filter(result => result.score >= minSimilarity)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    console.log(`Text search returned ${filteredResults.length} results`);
    
    return filteredResults;
  } catch (error) {
    console.error('Error in text search:', error);
    return works.map(work => ({ work, score: 0, textScore: 0, imageScore: 0 }));
  }
}

// Search by category
function searchByCategory(categoryId, works) {
  return works
    .filter(work => work.category === categoryId)
    .map(work => ({ work, score: 1.0, textScore: 0, imageScore: 0 }));
}

// Search by year
function searchByYear(year, works) {
  return works
    .filter(work => work.year === year.toString())
    .map(work => ({ work, score: 1.0, textScore: 0, imageScore: 0 }));
}

// Search by medium
function searchByMedium(medium, works) {
  return works
    .filter(work => {
      if (Array.isArray(work.medium)) {
        return work.medium.some(m => m.toLowerCase().includes(medium.toLowerCase()));
      }
      return work.medium && work.medium.toLowerCase().includes(medium.toLowerCase());
    })
    .map(work => ({ work, score: 1.0, textScore: 0, imageScore: 0 }));
}

// Get featured works
function getFeaturedWorks(works) {
  return works
    .filter(work => work.featured === true)
    .map(work => ({ work, score: 1.0, textScore: 0, imageScore: 0 }));
}

// Get work by ID
function getWorkById(id, works) {
  return works.find(work => work.id === id);
}

// Get works by status
function getWorksByStatus(status, works) {
  return works
    .filter(work => work.status === status)
    .map(work => ({ work, score: 1.0, textScore: 0, imageScore: 0 }));
}

// Compute embeddings for a single work
async function computeWorkEmbeddings(work) {
  try {
    console.log(`Computing embeddings for work: ${work.title}`);
    
    // Generate combined text for the work
    const combinedText = generateCombinedText(work);
    
    // Compute text embedding
    const textEmbedding = await textEmbeddings.computeEmbedding(combinedText);
    
    // Compute image embeddings for all images
    const imageEmbeddings = [];
    if (work.images && work.images.length > 0) {
      console.log(`Computing image embeddings for ${work.images.length} images`);
      
      // Note: This would require image embedding computation
      // For now, we'll use the existing image embeddings if available
      // In a full implementation, you'd need to compute CLIP image embeddings
      for (const imagePath of work.images) {
        // Placeholder for image embedding computation
        // imageEmbeddings.push(await computeImageEmbedding(imagePath));
      }
    }
    
    return {
      ...work,
      textEmbedding,
      imageEmbeddings,
      combinedText
    };
  } catch (error) {
    console.error(`Error computing embeddings for work ${work.id}:`, error);
    return {
      ...work,
      textEmbedding: null,
      imageEmbeddings: [],
      combinedText: generateCombinedText(work)
    };
  }
}

// Batch compute embeddings for all works
async function computeAllWorkEmbeddings(works) {
  console.log(`Computing embeddings for ${works.length} works`);
  
  const worksWithEmbeddings = [];
  
  for (const work of works) {
    const workWithEmbeddings = await computeWorkEmbeddings(work);
    worksWithEmbeddings.push(workWithEmbeddings);
  }
  
  console.log(`Completed embedding computation for ${worksWithEmbeddings.length} works`);
  return worksWithEmbeddings;
}

module.exports = {
  searchMultimodal,
  searchText,
  searchByCategory,
  searchByYear,
  searchByMedium,
  getFeaturedWorks,
  getWorkById,
  getWorksByStatus,
  computeWorkEmbeddings,
  computeAllWorkEmbeddings,
  generateCombinedText,
  cosineSimilarity
};
