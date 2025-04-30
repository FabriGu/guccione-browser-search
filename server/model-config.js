import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set the models directory path
export const MODELS_DIR = path.join(__dirname, '../models/huggingface');

// Override the default cache location for transformers
export function configureModelPath() {
  process.env.TRANSFORMERS_CACHE = MODELS_DIR;
  console.log("Using custom models directory:", process.env.TRANSFORMERS_CACHE);
  return MODELS_DIR;
}