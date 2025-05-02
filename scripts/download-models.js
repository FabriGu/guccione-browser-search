// scripts/download-models.js
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
    console.log('Downloading CLIP model...');
    
    // Set environment variables
    process.env.TRANSFORMERS_CACHE = MODELS_DIR;
    console.log('TRANSFORMERS_CACHE set to:', process.env.TRANSFORMERS_CACHE);
    
    // Initialize pipeline to trigger download
    console.log('Initializing feature extraction pipeline...');
    const extractFeatures = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch16', {
      cache_dir: MODELS_DIR,
      local_files_only: false
    });
    
    // Test the pipeline with a simple input
    console.log('Testing the pipeline...');
    const features = await extractFeatures('Hello world');
    console.log('Pipeline test successful, feature shape:', features.shape);
    
    console.log('CLIP model downloaded successfully!');
    
    // Log the model directory contents
    const files = await listFilesRecursively(MODELS_DIR);
    console.log('Model directory contents:');
    files.forEach(file => console.log(file));
    
    return true;
  } catch (error) {
    console.error('Error downloading models:', error);
    process.exit(1);
  }
}

// Helper function to list all files in a directory recursively
async function listFilesRecursively(dir) {
  const files = [];
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      const subDirFiles = await listFilesRecursively(fullPath);
      files.push(...subDirFiles.map(file => `${item.name}/${file}`));
    } else {
      files.push(item.name);
    }
  }
  
  return files;
}

// Run the function
downloadModels()
  .then(() => console.log('Model download completed successfully'))
  .catch(error => {
    console.error('Failed to download models:', error);
    process.exit(1);
  });