import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDir = path.join(__dirname, '../models/huggingface');

console.log('Checking models directory:', modelsDir);

function checkDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️ Directory does not exist: ${dir}`);
    return;
  }
  
  console.log(`✓ Directory exists: ${dir}`);
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  console.log(`Found ${files.length} items in directory`);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      console.log(`📁 Directory: ${file.name}`);
      checkDirectory(fullPath);
    } else {
      const stats = fs.statSync(fullPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`📄 File: ${file.name} (${sizeInMB} MB)`);
    }
  });
}

checkDirectory(modelsDir);