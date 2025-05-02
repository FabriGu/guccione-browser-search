// scripts/download-models-fixed.js
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

// Set environment variables
process.env.TRANSFORMERS_CACHE = MODELS_DIR;
console.log('TRANSFORMERS_CACHE set to:', process.env.TRANSFORMERS_CACHE);

async function downloadClipModel() {
  try {
    console.log('Downloading CLIP model components...');
    
    // Import transformers library
    const transformers = await import('@huggingface/transformers');
    
    // Load just the tokenizer and text model (we'll skip testing the vision model)
    console.log('Loading CLIP tokenizer...');
    const tokenizer = await transformers.AutoTokenizer.from_pretrained(
      "Xenova/clip-vit-base-patch16",
      { 
        cache_dir: MODELS_DIR,
        local_files_only: false
      }
    );
    
    console.log('Loading CLIP text model...');
    const textModel = await transformers.CLIPTextModelWithProjection.from_pretrained(
      "Xenova/clip-vit-base-patch16",
      { 
        cache_dir: MODELS_DIR,
        local_files_only: false,
        quantized: false
      }
    );
    
    // Test with simple text input
    console.log('Testing CLIP text model...');
    const textInputs = tokenizer(["a photo of a cat"], { padding: true, truncation: true });
    const { text_embeds } = await textModel(textInputs);
    
    console.log('CLIP text model test successful!');
    console.log('Embedding shape:', text_embeds.dims);
    
    console.log('CLIP model components downloaded successfully!');
    return true;
  } catch (error) {
    console.error('Error downloading CLIP model:', error);
    return false;
  }
}

async function downloadTextEmbeddingsModel() {
  try {
    console.log('Downloading text embeddings model...');
    
    // Import transformers library
    const transformers = await import('@huggingface/transformers');
    
    // Use pipeline for text embeddings
    console.log('Loading text embeddings model...');
    const pipeline = await transformers.pipeline(
      "feature-extraction", 
      "Xenova/all-MiniLM-L6-v2", 
      { 
        cache_dir: MODELS_DIR,
        local_files_only: false,
        quantized: false
      }
    );
    
    // Test the model
    console.log('Testing text embeddings model...');
    const output = await pipeline("Hello world", {
      pooling: "mean",
      normalize: true
    });
    
    console.log('Text embeddings model test successful!');
    console.log('Embedding length:', output.data.length);
    
    return true;
  } catch (error) {
    console.error('Error downloading text embeddings model:', error);
    return false;
  }
}

// Main function
async function downloadAllModels() {
  console.log('Starting download of all required models...');
  
  // Download CLIP model
  const clipSuccess = await downloadClipModel();
  
  // Download text embeddings model
  const textSuccess = await downloadTextEmbeddingsModel();
  
  console.log('');
  console.log('Download summary:');
  console.log(`- CLIP model: ${clipSuccess ? 'SUCCESS' : 'FAILED'}`);
  console.log(`- Text embeddings model: ${textSuccess ? 'SUCCESS' : 'FAILED'}`);
  console.log('');
  
  if (clipSuccess && textSuccess) {
    console.log('All models downloaded successfully!');
    return true;
  } else {
    console.log('Some models failed to download. Check the logs for details.');
    return false;
  }
}

// Run the download
downloadAllModels()
  .then(success => {
    if (success) {
      console.log('Model download process completed successfully.');
      process.exit(0);
    } else {
      console.error('Model download process completed with errors.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error during model download:', error);
    process.exit(1);
  });