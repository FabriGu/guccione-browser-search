// scripts/prepare-deploy.js
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('Preparing for deployment...');

// Ensure necessary directories exist
function ensureDirectories() {
  const dirs = [
    'models',
    'models/huggingface',
    'data'
  ];
  
  for (const dir of dirs) {
    const fullPath = path.join(rootDir, dir);
    if (!fs.existsSync(fullPath)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

// Create initial data files if they don't exist
function ensureDataFiles() {
  const files = [
    {
      path: 'data/search-history.json',
      content: JSON.stringify({ searches: [] }, null, 2)
    }
  ];
  
  for (const file of files) {
    const fullPath = path.join(rootDir, file.path);
    if (!fs.existsSync(fullPath)) {
      console.log(`Creating file: ${file.path}`);
      fs.writeFileSync(fullPath, file.content);
    }
  }
}

// Check that required files and models are included in Git LFS
function checkGitLfs() {
  try {
    // Check if git lfs is installed
    console.log('Checking Git LFS...');
    execSync('git lfs --version', { stdio: 'pipe' });
    
    // List git lfs tracked files
    const lfsFiles = execSync('git lfs ls-files', { stdio: 'pipe' }).toString();
    console.log('Git LFS tracked files:');
    console.log(lfsFiles || '(none)');
    
    // Check for missing ONNX files
    const embeddingsPath = path.join(rootDir, 'data/image-embeddings.json');
    if (fs.existsSync(embeddingsPath)) {
      console.log('Checking image embeddings...');
      const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));
      console.log(`Found ${embeddings.images?.length || 0} image embeddings`);
    } else {
      console.warn('Warning: data/image-embeddings.json not found');
    }
    
    // Ensure .gitattributes has correct entries
    const gitattributesPath = path.join(rootDir, '.gitattributes');
    if (fs.existsSync(gitattributesPath)) {
      const content = fs.readFileSync(gitattributesPath, 'utf8');
      if (!content.includes('*.onnx filter=lfs')) {
        console.warn('Warning: .gitattributes does not track *.onnx files. Add this line:');
        console.warn('models/**/*.onnx filter=lfs diff=lfs merge=lfs -text');
      }
    } else {
      console.warn('Warning: .gitattributes file not found. Create one with:');
      console.warn('models/**/*.onnx filter=lfs diff=lfs merge=lfs -text');
    }
    
  } catch (error) {
    console.warn('Git LFS check failed. Make sure Git LFS is installed.');
    console.warn('Error:', error.message);
  }
}

// Check for common issues with deployment environments
function checkDeploymentEnv() {
  // Check Node.js version
  const nodeVersion = process.version;
  console.log(`Node.js version: ${nodeVersion}`);
  
  const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0], 10);
  if (majorVersion < 16) {
    console.warn('Warning: Node.js 16+ is recommended for ONNX Runtime');
  }
  
  // Check if running on Linux
  const isLinux = process.platform === 'linux';
  if (isLinux) {
    try {
      const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
      console.log('Linux distribution:');
      
      const idLine = osRelease.split('\n').find(line => line.startsWith('ID='));
      const id = idLine ? idLine.split('=')[1].replace(/"/g, '') : 'unknown';
      
      console.log(`- Distribution ID: ${id}`);
      
      if (id === 'alpine') {
        console.warn('Warning: Alpine Linux detected. You may need to install:');
        console.warn('- libgomp: apk add --no-cache libgomp');
      } else if (id === 'ubuntu' || id === 'debian') {
        console.warn('Warning: Ubuntu/Debian detected. You may need to install:');
        console.warn('- libgomp1: apt-get install -y libgomp1');
      }
    } catch (error) {
      console.log('Could not determine Linux distribution');
    }
  }
  
  // Check memory (if possible)
  try {
    const totalMemory = process.memoryUsage().heapTotal / 1024 / 1024;
    console.log(`Available heap memory: ${totalMemory.toFixed(2)} MB`);
    
    if (totalMemory < 500) {
      console.warn('Warning: Low memory detected. ONNX models may fail to load.');
    }
  } catch (error) {
    console.log('Could not check memory usage');
  }
}

// Check app.yaml configuration
function checkAppYaml() {
  const appYamlPath = path.join(rootDir, 'app.yaml');
  if (fs.existsSync(appYamlPath)) {
    const content = fs.readFileSync(appYamlPath, 'utf8');
    
    console.log('Checking app.yaml configuration...');
    
    // Check for git_lfs flag
    if (!content.includes('git_lfs: true')) {
      console.warn('Warning: app.yaml does not enable Git LFS. Add:');
      console.warn('git:\n  git_lfs: true');
    }
    
    // Check for appropriate instance size
    if (!content.includes('instance_size_slug: ')) {
      console.warn('Warning: app.yaml does not specify instance size. Consider setting:');
      console.warn('instance_size_slug: basic-xxl');
    } else if (!content.includes('basic-xl') && !content.includes('basic-xxl')) {
      console.warn('Warning: instance size may be too small for loading ONNX models.');
      console.warn('Consider using at least basic-xl or basic-xxl instance size.');
    }
    
    // Check for transformers cache environment variable
    if (!content.includes('TRANSFORMERS_CACHE')) {
      console.warn('Warning: TRANSFORMERS_CACHE environment variable not set in app.yaml.');
      console.warn('Add the following to the envs section:');
      console.warn('- key: TRANSFORMERS_CACHE\n  value: /app/models/huggingface');
    }
  } else {
    console.warn('Warning: app.yaml not found. Make sure to have proper configuration.');
  }
}

// Finalize package.json
function updatePackageJson() {
  const packageJsonPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add download-all-models to scripts if it doesn't exist
    if (!packageJson.scripts['download-all-models']) {
      packageJson.scripts['download-all-models'] = 'node scripts/download-all-models.js';
      packageJson.scripts['prepare-deploy'] = 'node scripts/prepare-deploy.js';
      
      // Add prestart script to ensure models are available
      packageJson.scripts['prestart'] = 'npm run download-all-models || true';
      
      console.log('Updated package.json scripts');
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
    
    // Ensure engines field is set correctly
    if (!packageJson.engines || !packageJson.engines.node) {
      packageJson.engines = packageJson.engines || {};
      packageJson.engines.node = '>=16.0.0';
      console.log('Updated Node.js engine requirement to >=16.0.0');
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
  }
}

// Main function
async function main() {
  console.log('=== Deployment Preparation ===');
  
  // Run all checks
  ensureDirectories();
  ensureDataFiles();
  checkGitLfs();
  checkDeploymentEnv();
  checkAppYaml();
  updatePackageJson();
  
  console.log('=== Preparation Complete ===');
  console.log('Next steps:');
  console.log('1. Run: npm run download-all-models');
  console.log('2. Check that models download and validate correctly');
  console.log('3. Commit changes and push to your repository');
  console.log('4. Deploy your application');
}

// Run the main function
main().catch(error => {
  console.error('Error during preparation:', error);
  process.exit(1);
});