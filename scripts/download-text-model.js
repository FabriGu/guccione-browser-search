// scripts/download-text-model.js
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

async function downloadTextModel() {
  try {
    console.log('Downloading text embeddings model...');
    
    // Set environment variables
    process.env.TRANSFORMERS_CACHE = MODELS_DIR;
    console.log('TRANSFORMERS_CACHE set to:', process.env.TRANSFORMERS_CACHE);
    
    // Initialize pipeline to trigger download
    console.log('Initializing feature extraction pipeline...');
    const extractFeatures = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      cache_dir: MODELS_DIR,
      local_files_only: false // Set to false to download the model
    });
    
    // Test the pipeline with a simple input
    console.log('Testing the pipeline...');
    const features = await extractFeatures('Hello world');
    console.log('Pipeline test successful, feature shape:', features.data.length);
    
    console.log('Text embeddings model downloaded successfully!');
    
    // Log the model directory contents
    const modelDir = path.join(MODELS_DIR, 'Xenova', 'all-MiniLM-L6-v2');
    if (fs.existsSync(modelDir)) {
      console.log('Model directory contents:');
      listFilesRecursively(modelDir, '');
    }
    
    return true;
  } catch (error) {
    console.error('Error downloading model:', error);
    process.exit(1);
  }
}

// Helper function to list files recursively
function listFilesRecursively(dir, indent) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    console.log(`${indent}${item.isDirectory() ? '📁' : '📄'} ${item.name}`);
    
    if (item.isDirectory()) {
      listFilesRecursively(fullPath, indent + '  ');
    }
  }
}

// Run the function
downloadTextModel()
  .then(() => console.log('Model download completed successfully'))
  .catch(error => {
    console.error('Failed to download model:', error);
    process.exit(1);
  });