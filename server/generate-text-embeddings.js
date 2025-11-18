// server/generate-text-embeddings.js
// Generate MiniLM text embeddings for all works in works.json

const fs = require('fs');
const path = require('path');

// Set environment for model cache
process.env.TRANSFORMERS_CACHE = path.join(__dirname, '../models/huggingface');

async function generateWorkEmbeddings() {
  console.log('='.repeat(60));
  console.log('Text Embeddings Generator for Guccione Browser');
  console.log('='.repeat(60));
  console.log();

  console.log('Loading transformers library...');
  const { pipeline } = await import('@huggingface/transformers');

  console.log('Loading MiniLM-L6-v2 model (384-dim embeddings)...');
  console.log('(First run will download model, ~100MB, be patient!)');
  const extractor = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  );
  console.log('✓ Model loaded successfully\n');

  const worksPath = path.join(__dirname, '../data/works.json');
  console.log(`Loading works from: ${worksPath}`);
  const worksData = JSON.parse(fs.readFileSync(worksPath, 'utf8'));

  if (!worksData.works || !Array.isArray(worksData.works)) {
    console.error('Error: Invalid works.json structure');
    process.exit(1);
  }

  console.log(`Found ${worksData.works.length} works to process\n`);
  console.log('-'.repeat(60));

  let successCount = 0;
  let skipCount = 0;

  for (let i = 0; i < worksData.works.length; i++) {
    const work = worksData.works[i];
    const num = `[${i + 1}/${worksData.works.length}]`;

    console.log(`${num} ${work.title}`);

    // Check if already has embedding
    if (work.textEmbedding && Array.isArray(work.textEmbedding) && work.textEmbedding.length === 384) {
      console.log(`  ⊙ Already has embedding (${work.textEmbedding.length}-dim), skipping`);
      skipCount++;
      continue;
    }

    try {
      // Use textContent if available, otherwise description
      const text = work.textContent || work.description;

      if (!text) {
        console.log('  ⚠ No text content found, skipping');
        skipCount++;
        continue;
      }

      console.log(`  → Generating embedding from ${text.length} chars of text...`);

      // Generate embedding
      const output = await extractor(text, {
        pooling: 'mean',
        normalize: true
      });

      // Store as array
      work.textEmbedding = Array.from(output.data);

      console.log(`  ✓ Generated ${work.textEmbedding.length}-dim embedding`);
      successCount++;

    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
    }

    console.log();
  }

  console.log('-'.repeat(60));
  console.log('Summary:');
  console.log(`  ✓ Generated: ${successCount} new embeddings`);
  console.log(`  ⊙ Skipped: ${skipCount} (already had embeddings)`);
  console.log(`  Total works: ${worksData.works.length}`);
  console.log();

  // Save to works-with-embeddings.json
  const outputPath = path.join(__dirname, '../data/works-with-embeddings.json');
  fs.writeFileSync(outputPath, JSON.stringify(worksData, null, 2));

  console.log(`💾 Saved to: ${outputPath}`);
  console.log();
  console.log('✅ Done! Restart your server to use the new embeddings.');
  console.log('='.repeat(60));
}

// Run
generateWorkEmbeddings().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
