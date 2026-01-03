/**
 * Hybrid Search Configuration
 * Defines weights and thresholds for combining multiple search strategies
 */

module.exports = {
  // Search strategy weights (must sum to 1.0)
  weights: {
    semantic: 0.60,      // Embedding-based similarity (CLIP + text embeddings)
    keyword: 0.15,       // Exact keyword matches in title/description/tags
    fuzzy: 0.10,         // Typo-tolerant fuzzy matching
    metadata: 0.15       // Year, medium, category matches
  },

  // Minimum scores for including results
  thresholds: {
    semantic: 0.15,      // Minimum cosine similarity (0-1)
    keyword: 0.0,        // No minimum (keyword is boolean-ish)
    fuzzy: 0.3,          // Minimum Fuse.js score (0-1, lower is better)
    metadata: 0.0,       // No minimum
    combined: 0.12       // Minimum combined score to include in results
  },

  // Fuse.js configuration for fuzzy matching
  fuseOptions: {
    includeScore: true,
    threshold: 0.4,      // 0.0 = exact match, 1.0 = match anything
    distance: 100,       // Maximum distance for fuzzy matching
    minMatchCharLength: 2,
    keys: [
      {
        name: 'title',
        weight: 0.5
      },
      {
        name: 'description',
        weight: 0.2
      },
      {
        name: 'textContent',
        weight: 0.2
      },
      {
        name: 'tags',
        weight: 0.1
      }
    ]
  },

  // Keyword matching configuration
  keywordOptions: {
    caseSensitive: false,
    stemming: true,       // Match "design" with "designing", "designer"
    partialMatch: true    // "photo" matches "photography"
  },

  // Result limits
  maxResults: 50,
  defaultResultLimit: 20
};
