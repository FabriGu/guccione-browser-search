import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Use absolute path to avoid any resolution issues
const MODELS_DIR = path.resolve(__dirname, '../models/huggingface');

// Export a function to verify model paths
export function verifyModelPaths() {
  console.log("Models directory:", MODELS_DIR);
  console.log("Directory exists:", fs.existsSync(MODELS_DIR));
  
  if (fs.existsSync(MODELS_DIR)) {
    // List contents to debug
    const contents = fs.readdirSync(MODELS_DIR);
    console.log("Contents:", contents);
    
    // Check for specific model paths
    const xenovaPath = path.join(MODELS_DIR, 'Xenova', 'clip-vit-base-patch16');
    console.log("Xenova path:", xenovaPath);
    console.log("Xenova path exists:", fs.existsSync(xenovaPath));
    
    if (fs.existsSync(xenovaPath)) {
      const xenovaContents = fs.readdirSync(xenovaPath);
      console.log("Xenova contents:", xenovaContents);
      
      // Check for the specific model file
      const modelPath = path.join(xenovaPath, 'onnx', 'text_model.onnx');
      console.log("Model file exists:", fs.existsSync(modelPath));
    }
  }
}

// Override the default cache location for transformers
export function configureModelPath() {
  process.env.TRANSFORMERS_CACHE = MODELS_DIR;
  console.log("Using custom models directory:", process.env.TRANSFORMERS_CACHE);
  verifyModelPaths(); // Call verification
  return MODELS_DIR;
}