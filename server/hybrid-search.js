/**
 * Hybrid Search Engine
 * Combines semantic embeddings, keyword matching, fuzzy search, and metadata filtering
 */

const Fuse = require('fuse.js');
const config = require('./search-config');

class HybridSearchEngine {
  constructor(works, textEmbeddingModel = null, imageEmbeddingModel = null) {
    this.works = works;
    this.textEmbeddingModel = textEmbeddingModel;
    this.imageEmbeddingModel = imageEmbeddingModel;

    // Initialize Fuse.js for fuzzy matching
    this.fuse = new Fuse(works, config.fuseOptions);

    // Build keyword index for fast exact matching
    this.keywordIndex = this.buildKeywordIndex(works);
  }

  /**
   * Build inverted index for keyword matching
   */
  buildKeywordIndex(works) {
    const index = new Map();

    works.forEach((work, workIndex) => {
      const terms = this.extractTerms(work);

      terms.forEach(term => {
        if (!index.has(term)) {
          index.set(term, []);
        }
        index.get(term).push(workIndex);
      });
    });

    return index;
  }

  /**
   * Extract searchable terms from a work
   */
  extractTerms(work) {
    const terms = new Set();

    // Add title terms
    if (work.title) {
      this.tokenize(work.title).forEach(t => terms.add(t));
    }

    // Add description terms
    if (work.description) {
      this.tokenize(work.description).forEach(t => terms.add(t));
    }

    // Add text content terms
    if (work.textContent) {
      this.tokenize(work.textContent).forEach(t => terms.add(t));
    }

    // Add tags
    if (work.tags && Array.isArray(work.tags)) {
      work.tags.forEach(tag => {
        this.tokenize(tag).forEach(t => terms.add(t));
      });
    }

    // Add medium
    if (work.medium && Array.isArray(work.medium)) {
      work.medium.forEach(m => {
        this.tokenize(m).forEach(t => terms.add(t));
      });
    }

    // Add category
    if (work.category) {
      this.tokenize(work.category).forEach(t => terms.add(t));
    }

    return Array.from(terms);
  }

  /**
   * Tokenize text into searchable terms
   */
  tokenize(text) {
    if (!text) return [];

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(term => term.length >= 2) // Minimum 2 characters
      .map(term => config.keywordOptions.stemming ? this.stem(term) : term);
  }

  /**
   * Simple stemming (remove common suffixes)
   */
  stem(word) {
    // Very basic stemming - just enough for common cases
    const suffixes = ['ing', 'ed', 'er', 'est', 's'];

    for (const suffix of suffixes) {
      if (word.endsWith(suffix) && word.length > suffix.length + 2) {
        return word.slice(0, -suffix.length);
      }
    }

    return word;
  }

  /**
   * Compute cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Semantic search using embeddings
   */
  async semanticSearch(query, queryEmbedding = null) {
    const scores = [];

    // Get query embedding if not provided
    let embedding = queryEmbedding;
    if (!embedding && this.textEmbeddingModel) {
      try {
        const output = await this.textEmbeddingModel(query, { pooling: 'mean', normalize: true });
        embedding = Array.from(output.data);
      } catch (error) {
        console.error('Error generating query embedding:', error);
        return [];
      }
    }

    if (!embedding) {
      return [];
    }

    // Compare with each work's text embedding
    this.works.forEach((work, index) => {
      if (work.textEmbedding && Array.isArray(work.textEmbedding)) {
        const similarity = this.cosineSimilarity(embedding, work.textEmbedding);

        if (similarity >= config.thresholds.semantic) {
          scores.push({
            workIndex: index,
            score: similarity,
            type: 'semantic'
          });
        }
      }
    });

    return scores;
  }

  /**
   * Keyword exact matching
   */
  keywordSearch(query) {
    const queryTerms = this.tokenize(query);
    const scores = new Map();

    queryTerms.forEach(term => {
      const matchingWorkIndices = this.keywordIndex.get(term) || [];

      matchingWorkIndices.forEach(workIndex => {
        const currentScore = scores.get(workIndex) || 0;
        scores.set(workIndex, currentScore + 1);
      });
    });

    // Normalize scores by query term count
    const maxScore = queryTerms.length;
    const results = [];

    scores.forEach((count, workIndex) => {
      const normalizedScore = maxScore > 0 ? count / maxScore : 0;

      if (normalizedScore >= config.thresholds.keyword) {
        results.push({
          workIndex,
          score: normalizedScore,
          type: 'keyword'
        });
      }
    });

    return results;
  }

  /**
   * Fuzzy search for typo tolerance
   */
  fuzzySearch(query) {
    const fuseResults = this.fuse.search(query);
    const results = [];

    fuseResults.forEach(result => {
      // Fuse.js score is 0-1 where 0 is perfect match
      // We invert it so higher is better
      const invertedScore = 1 - result.score;

      if (result.score <= config.thresholds.fuzzy) {
        const workIndex = this.works.findIndex(w => w.id === result.item.id);

        if (workIndex !== -1) {
          results.push({
            workIndex,
            score: invertedScore,
            type: 'fuzzy'
          });
        }
      }
    });

    return results;
  }

  /**
   * Metadata matching (year, medium, category, tags)
   */
  metadataSearch(query) {
    const queryLower = query.toLowerCase();
    const results = [];

    this.works.forEach((work, index) => {
      let score = 0;
      let matches = 0;

      // Check year
      if (work.year && queryLower.includes(work.year)) {
        score += 0.3;
        matches++;
      }

      // Check medium
      if (work.medium && Array.isArray(work.medium)) {
        work.medium.forEach(m => {
          if (queryLower.includes(m.toLowerCase())) {
            score += 0.2;
            matches++;
          }
        });
      }

      // Check category
      if (work.category && queryLower.includes(work.category.toLowerCase())) {
        score += 0.3;
        matches++;
      }

      // Check tags
      if (work.tags && Array.isArray(work.tags)) {
        work.tags.forEach(tag => {
          if (queryLower.includes(tag.toLowerCase())) {
            score += 0.2;
            matches++;
          }
        });
      }

      if (score >= config.thresholds.metadata) {
        results.push({
          workIndex: index,
          score: Math.min(score, 1.0), // Cap at 1.0
          type: 'metadata'
        });
      }
    });

    return results;
  }

  /**
   * Combine scores from all search strategies
   */
  combineScores(semanticScores, keywordScores, fuzzyScores, metadataScores) {
    const combinedScores = new Map();

    // Helper to add score to map
    const addScore = (workIndex, score, type) => {
      if (!combinedScores.has(workIndex)) {
        combinedScores.set(workIndex, {
          workIndex,
          scores: {
            semantic: 0,
            keyword: 0,
            fuzzy: 0,
            metadata: 0
          },
          combined: 0
        });
      }

      const entry = combinedScores.get(workIndex);
      entry.scores[type] = score;
    };

    // Add all scores
    semanticScores.forEach(s => addScore(s.workIndex, s.score, 'semantic'));
    keywordScores.forEach(s => addScore(s.workIndex, s.score, 'keyword'));
    fuzzyScores.forEach(s => addScore(s.workIndex, s.score, 'fuzzy'));
    metadataScores.forEach(s => addScore(s.workIndex, s.score, 'metadata'));

    // Calculate weighted combined scores
    const results = [];

    combinedScores.forEach((entry, workIndex) => {
      const combined =
        entry.scores.semantic * config.weights.semantic +
        entry.scores.keyword * config.weights.keyword +
        entry.scores.fuzzy * config.weights.fuzzy +
        entry.scores.metadata * config.weights.metadata;

      entry.combined = combined;

      if (combined >= config.thresholds.combined) {
        results.push({
          work: this.works[workIndex],
          score: combined,
          breakdown: entry.scores
        });
      }
    });

    // Sort by combined score (descending)
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, config.maxResults);
  }

  /**
   * Main hybrid search method
   */
  async search(query, options = {}) {
    const {
      limit = config.defaultResultLimit,
      queryEmbedding = null,
      enableSemanticSearch = true,
      enableKeywordSearch = true,
      enableFuzzySearch = true,
      enableMetadataSearch = true
    } = options;

    // Run all enabled search strategies in parallel
    const searches = [];

    if (enableSemanticSearch && (this.textEmbeddingModel || queryEmbedding)) {
      searches.push(this.semanticSearch(query, queryEmbedding));
    } else {
      searches.push(Promise.resolve([]));
    }

    if (enableKeywordSearch) {
      searches.push(Promise.resolve(this.keywordSearch(query)));
    } else {
      searches.push(Promise.resolve([]));
    }

    if (enableFuzzySearch) {
      searches.push(Promise.resolve(this.fuzzySearch(query)));
    } else {
      searches.push(Promise.resolve([]));
    }

    if (enableMetadataSearch) {
      searches.push(Promise.resolve(this.metadataSearch(query)));
    } else {
      searches.push(Promise.resolve([]));
    }

    const [semanticScores, keywordScores, fuzzyScores, metadataScores] = await Promise.all(searches);

    // Combine and return results
    const combinedResults = this.combineScores(
      semanticScores,
      keywordScores,
      fuzzyScores,
      metadataScores
    );

    return combinedResults.slice(0, limit);
  }
}

module.exports = HybridSearchEngine;
