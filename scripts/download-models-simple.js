// scripts/download-models-simple.js
import { pipeline } from '@huggingface/transformers';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, '../models/huggingface');

console.log('Setting up models directory:', MODELS_DIR);

// Create models directory if it doesn't exist
if (!fs.existsSync(MODELS_DIR)) {
  console.log(`Creating directory: ${MODELS_DIR}`);
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

async function downloadModels() {
  try {
    console.log('Starting model downloads...');
    
    // Set environment variables
    process.env.TRANSFORMERS_CACHE = MODELS_DIR;
    console.log('TRANSFORMERS_CACHE set to:', process.env.TRANSFORMERS_CACHE);
    
    // Download options that help with compatibility
    const downloadOptions = {
      cache_dir: MODELS_DIR,
      local_files_only: false,
      revision: 'main', 
      quantized: false  // Use full precision for better compatibility
    };
    
    // Import transformers library
    const transformers = await import('@huggingface/transformers');
    
    // PART 1: Download text embeddings model
    console.log('Downloading text embeddings model...');
    const textExtractor = await transformers.pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      downloadOptions
    );
    
    // Test text embeddings model
    console.log('Testing text embeddings model...');
    const textOutput = await textExtractor('Test sentence', {
      pooling: 'mean',
      normalize: true
    });
    console.log('Text embeddings model works! Vector size:', textOutput.data.length);
    
    // PART 2: Download CLIP model components separately
    console.log('Downloading CLIP tokenizer...');
    const clipTokenizer = await transformers.AutoTokenizer.from_pretrained(
      'Xenova/clip-vit-base-patch16',
      downloadOptions
    );
    
    console.log('Downloading CLIP text model...');
    const clipTextModel = await transformers.CLIPTextModelWithProjection.from_pretrained(
      'Xenova/clip-vit-base-patch16',
      downloadOptions
    );
    
    // Test CLIP text model
    console.log('Testing CLIP text model...');
    const clipInputs = clipTokenizer(['A photo of a cat'], { padding: true, truncation: true });
    const { text_embeds } = await clipTextModel(clipInputs);
    console.log('CLIP text model works! Embedding shape:', text_embeds.dims);
    
    console.log('All models downloaded and tested successfully!');
    return true;
  } catch (error) {
    console.error('Error downloading models:', error);
    return false;
  }
}

// Execute the function
downloadModels()
  .then(success => {
    if (success) {
      console.log('Model download process completed successfully!');
      process.exit(0);
    } else {
      console.error('Model download process failed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error during model download:', error);
    process.exit(1);
  });