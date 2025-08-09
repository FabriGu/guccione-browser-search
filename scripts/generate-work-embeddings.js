// scripts/generate-work-embeddings.js - Generate embeddings for work data
const fs = require('fs');
const path = require('path');

// Set up environment
const MODELS_DIR = path.join(__dirname, '../models/huggingface');
process.env.TRANSFORMERS_CACHE = MODELS_DIR;

// Import required modules
const textEmbeddings = require('../server/text-embeddings');
const imageSearch = require('../server/image-search');
const workSearch = require('../server/work-search');

// File paths
const WORKS_INPUT_FILE = path.join(__dirname, '../data/works.json');
const WORKS_OUTPUT_FILE = path.join(__dirname, '../data/works-with-embeddings.json');
const IMAGE_EMBEDDINGS_FILE = path.join(__dirname, '../data/image-embeddings.json');

// Load existing image embeddings if available
function loadExistingImageEmbeddings() {
  try {
    if (fs.existsSync(IMAGE_EMBEDDINGS_FILE)) {
      console.log('Loading existing image embeddings...');
      const data = fs.readFileSync(IMAGE_EMBEDDINGS_FILE, 'utf8');
      const embeddings = JSON.parse(data);
      console.log(`Loaded ${embeddings.images?.length || 0} existing image embeddings`);
      return embeddings.images || [];
    }
  } catch (error) {
    console.error('Error loading existing image embeddings:', error);
  }
  return [];
}

// Find image embedding by URL
function findImageEmbedding(imageUrl, existingEmbeddings) {
  return existingEmbeddings.find(embedding => embedding.url === imageUrl);
}

// Generate embeddings for a single work
async function generateWorkEmbeddings(work, existingImageEmbeddings) {
  try {
    console.log(`\nProcessing work: ${work.title}`);
    
    // Generate combined text for embedding
    const combinedText = workSearch.generateCombinedText(work);
    console.log(`Combined text length: ${combinedText.length} characters`);
    
    // Compute text embedding
    console.log('Computing text embedding...');
    const textEmbedding = await textEmbeddings.computeEmbedding(combinedText);
    
    // Get image embeddings from existing data
    const imageEmbeddings = [];
    if (work.images && work.images.length > 0) {
      console.log(`Processing ${work.images.length} images...`);
      
      for (const imagePath of work.images) {
        const existingEmbedding = findImageEmbedding(imagePath, existingImageEmbeddings);
        if (existingEmbedding) {
          console.log(`Found existing embedding for: ${imagePath}`);
          imageEmbeddings.push(existingEmbedding.embedding);
        } else {
          console.log(`No existing embedding found for: ${imagePath}`);
          // For now, we'll skip missing embeddings
          // In a full implementation, you'd compute new image embeddings here
        }
      }
    }
    
    console.log(`Work processed successfully:
    - Text embedding: ${textEmbedding ? 'Generated' : 'Failed'}
    - Image embeddings: ${imageEmbeddings.length}/${work.images?.length || 0}`);
    
    return {
      ...work,
      textEmbedding,
      imageEmbeddings,
      combinedText,
      embeddingStats: {
        textEmbeddingGenerated: !!textEmbedding,
        imageEmbeddingsCount: imageEmbeddings.length,
        totalImages: work.images?.length || 0
      }
    };
  } catch (error) {
    console.error(`Error processing work ${work.id}:`, error);
    return {
      ...work,
      textEmbedding: null,
      imageEmbeddings: [],
      combinedText: workSearch.generateCombinedText(work),
      embeddingStats: {
        textEmbeddingGenerated: false,
        imageEmbeddingsCount: 0,
        totalImages: work.images?.length || 0,
        error: error.message
      }
    };
  }
}

// Main function to generate all embeddings
async function generateAllEmbeddings() {
  try {
    console.log('Starting work embeddings generation...');
    console.log('='.repeat(50));
    
    // Check if input file exists
    if (!fs.existsSync(WORKS_INPUT_FILE)) {
      throw new Error(`Works file not found: ${WORKS_INPUT_FILE}`);
    }
    
    // Load works data
    console.log('Loading works data...');
    const worksData = JSON.parse(fs.readFileSync(WORKS_INPUT_FILE, 'utf8'));
    const works = worksData.works || [];
    console.log(`Loaded ${works.length} works`);
    
    // Load existing image embeddings
    const existingImageEmbeddings = loadExistingImageEmbeddings();
    
    // Initialize models
    console.log('\nInitializing models...');
    const [textSuccess, imageSuccess] = await Promise.all([
      textEmbeddings.initialize(),
      imageSearch.initialize()
    ]);
    
    if (!textSuccess) {
      throw new Error('Failed to initialize text embeddings model');
    }
    
    if (!imageSuccess) {
      console.warn('Failed to initialize image search model - image search may be limited');
    }
    
    console.log(`Models initialized:
    - Text embeddings: ${textSuccess ? 'Success' : 'Failed'}
    - Image search: ${imageSuccess ? 'Success' : 'Failed'}`);
    
    // Generate embeddings for all works
    console.log('\n' + '='.repeat(50));
    console.log('Generating embeddings for works...');
    
    const worksWithEmbeddings = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < works.length; i++) {
      const work = works[i];
      console.log(`\n[${i + 1}/${works.length}] Processing: ${work.title}`);
      
      try {
        const workWithEmbeddings = await generateWorkEmbeddings(work, existingImageEmbeddings);
        worksWithEmbeddings.push(workWithEmbeddings);
        
        if (workWithEmbeddings.embeddingStats.textEmbeddingGenerated) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Failed to process work ${work.id}:`, error);
        worksWithEmbeddings.push({
          ...work,
          textEmbedding: null,
          imageEmbeddings: [],
          embeddingStats: { error: error.message }
        });
        errorCount++;
      }
    }
    
    // Prepare output data
    const outputData = {
      ...worksData,
      works: worksWithEmbeddings,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalWorks: works.length,
        successfulEmbeddings: successCount,
        failedEmbeddings: errorCount,
        existingImageEmbeddings: existingImageEmbeddings.length
      }
    };
    
    // Save results
    console.log('\n' + '='.repeat(50));
    console.log('Saving results...');
    fs.writeFileSync(WORKS_OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    console.log(`Results saved to: ${WORKS_OUTPUT_FILE}`);
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('EMBEDDING GENERATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total works processed: ${works.length}`);
    console.log(`Successful text embeddings: ${successCount}`);
    console.log(`Failed text embeddings: ${errorCount}`);
    console.log(`Total image embeddings used: ${worksWithEmbeddings.reduce((sum, work) => sum + work.imageEmbeddings.length, 0)}`);
    console.log(`Output file: ${WORKS_OUTPUT_FILE}`);
    
    if (errorCount > 0) {
      console.log('\nWorks with errors:');
      worksWithEmbeddings
        .filter(work => work.embeddingStats?.error)
        .forEach(work => {
          console.log(`- ${work.title}: ${work.embeddingStats.error}`);
        });
    }
    
    console.log('\nEmbedding generation completed!');
    
  } catch (error) {
    console.error('Fatal error during embedding generation:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateAllEmbeddings()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  generateAllEmbeddings,
  generateWorkEmbeddings,
  loadExistingImageEmbeddings
};
