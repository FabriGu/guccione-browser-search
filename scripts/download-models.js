// scripts/download-models.js
import { pipeline } from '@huggingface/transformers';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, '../models/huggingface');

console.log('Setting up models directory:', MODELS_DIR);
console.log('This script will download the CLIP model for text embeddings');

async function downloadModels() {
  try {
    console.log('Downloading CLIP model...');
    
    // Initialize tokenizer to trigger download
    await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch16', {
      cache_dir: MODELS_DIR
    });
    
    console.log('CLIP model downloaded successfully!');
  } catch (error) {
    console.error('Error downloading models:', error);
    process.exit(1);
  }
}

downloadModels();