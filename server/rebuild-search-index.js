// server/rebuild-search-index.js
// Master script to rebuild entire search index from project JSONs

const { execSync } = require('child_process');
const path = require('path');

console.log('\n' + '='.repeat(60));
console.log('GUCCIONE BROWSER - REBUILD SEARCH INDEX');
console.log('='.repeat(60));
console.log();
console.log('This will:');
console.log('  1. Build works index from project JSONs');
console.log('  2. Generate text embeddings (MiniLM)');
console.log('  3. Build image catalog from project JSONs');
console.log('  4. Generate image embeddings (CLIP)');
console.log();
console.log('Note: First run will download models (~700MB)');
console.log('      This can take 30-60 minutes total.');
console.log();

// Helper to run script and show output
function runScript(scriptName, description) {
  console.log('='.repeat(60));
  console.log(`STEP: ${description}`);
  console.log('='.repeat(60));
  console.log();

  try {
    // Properly quote the script path to handle spaces
    const scriptPath = path.join(__dirname, scriptName);
    execSync(`node "${scriptPath}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log();
    return true;
  } catch (error) {
    console.error(`\n❌ Error in ${scriptName}`);
    console.error(error.message);
    return false;
  }
}

// Run all steps
const steps = [
  ['build-works-index.js', 'Building Works Index'],
  ['generate-text-embeddings.js', 'Generating Text Embeddings'],
  ['build-image-catalog.js', 'Building Image Catalog'],
  ['generate-image-embeddings.js', 'Generating Image Embeddings']
];

let currentStep = 1;
for (const [script, description] of steps) {
  console.log(`\n[${ currentStep}/${steps.length}] ${description}...`);
  console.log();

  if (!runScript(script, description)) {
    console.log('\n❌ Build failed. Fix errors and try again.');
    process.exit(1);
  }

  currentStep++;
}

console.log('\n' + '='.repeat(60));
console.log('✅ COMPLETE! Search index fully rebuilt.');
console.log('='.repeat(60));
console.log();
console.log('Next steps:');
console.log('  1. Restart your server: npm run dev');
console.log('  2. Test search at: http://localhost:3000');
console.log('  3. Commit and push to deploy');
console.log();
