// server/generate-image-embeddings.js
// Generate CLIP image embeddings for all images in image-catalog.json

const express = require('express');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

// Configure ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Set environment
process.env.TRANSFORMERS_CACHE = path.join(__dirname, '../models/huggingface');

const PORT = 3002;
const __dirname_root = path.join(__dirname, '..');

async function loadImageCatalog() {
  const catalogPath = path.join(__dirname_root, 'data/image-catalog.json');
  console.log(`Loading catalog from: ${catalogPath}`);

  if (!fs.existsSync(catalogPath)) {
    console.error('Error: image-catalog.json not found!');
    console.error('Please create it first with your project images.');
    process.exit(1);
  }

  const rawData = fs.readFileSync(catalogPath, 'utf8');
  const catalog = JSON.parse(rawData);

  if (!catalog.images || !Array.isArray(catalog.images)) {
    console.error('Error: Invalid catalog structure');
    process.exit(1);
  }

  return catalog.images;
}

async function loadExistingEmbeddings() {
  const embeddingsPath = path.join(__dirname_root, 'data/image-embeddings.json');

  if (!fs.existsSync(embeddingsPath)) {
    console.log('No existing embeddings found, will create new file');
    return new Map();
  }

  const data = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));
  const map = new Map();

  if (data.images && Array.isArray(data.images)) {
    data.images.forEach(item => {
      if (item.embedding && item.embedding.length === 512) {
        map.set(item.url, item.embedding);
      }
    });
  }

  console.log(`Loaded ${map.size} existing embeddings`);
  return map;
}

/**
 * Detects if a file is a video based on extension
 * @param {string} url - File path
 * @returns {boolean} - True if video file
 */
function isVideoFile(url) {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.mov', '.webm', '.MOV', '.MP4', '.WEBM'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext.toLowerCase()));
}

/**
 * Extracts first frame from video file as RawImage
 * @param {string} localPath - Absolute path to video file
 * @returns {Promise<RawImage>} - RawImage from first frame
 */
async function extractFirstFrame(localPath) {
  const { RawImage } = await import('@huggingface/transformers');
  const tmpDir = path.join(__dirname, '../tmp');
  const tmpPath = path.join(tmpDir, `frame-${Date.now()}.jpg`);

  // Ensure tmp directory exists
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    ffmpeg(localPath)
      .screenshots({
        timestamps: [0.1],  // Extract at 0.1 seconds (avoid black first frame)
        filename: path.basename(tmpPath),
        folder: path.dirname(tmpPath),
        size: '1280x?'  // Width 1280px, maintain aspect ratio
      })
      .on('end', async () => {
        try {
          const image = await RawImage.read(tmpPath);
          fs.unlinkSync(tmpPath);  // Clean up temp file
          resolve(image);
        } catch (err) {
          reject(new Error(`Failed to read extracted frame: ${err.message}`));
        }
      })
      .on('error', (err) => {
        reject(new Error(`FFmpeg extraction failed: ${err.message}`));
      });
  });
}

async function startServer() {
  console.log('='.repeat(60));
  console.log('CLIP Image Embeddings Generator for Guccione Browser');
  console.log('='.repeat(60));
  console.log();

  const app = express();

  // Serve static files from public
  app.use('/public', express.static(path.join(__dirname_root, 'public')));
  app.use('/assets', express.static(path.join(__dirname_root, 'public/assets')));

  const server = app.listen(PORT, () => {
    console.log(`✓ Local server running at http://localhost:${PORT}`);
    console.log();

    processImages()
      .then(() => {
        console.log();
        console.log('✅ Processing complete!');
        console.log('='.repeat(60));
        server.close();
      })
      .catch(error => {
        console.error('Error:', error);
        server.close();
        process.exit(1);
      });
  });
}

async function processImages() {
  console.log('Loading CLIP model...');
  console.log('(First run will download model, ~600MB, be patient!)');

  const { AutoProcessor, CLIPVisionModelWithProjection, RawImage } =
    await import('@huggingface/transformers');

  const model = await CLIPVisionModelWithProjection.from_pretrained(
    'Xenova/clip-vit-base-patch16'
  );
  const processor = await AutoProcessor.from_pretrained(
    'Xenova/clip-vit-base-patch16'
  );

  console.log('✓ CLIP model loaded successfully\n');

  const imageItems = await loadImageCatalog();
  const existingEmbeddings = await loadExistingEmbeddings();

  console.log(`Found ${imageItems.length} images in catalog`);
  console.log();
  console.log('-'.repeat(60));

  const result = { images: [] };
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const [index, item] of imageItems.entries()) {
    const num = `[${index + 1}/${imageItems.length}]`;
    console.log(`${num} ${item.url}`);

    try {
      // Check if already have embedding
      if (existingEmbeddings.has(item.url)) {
        console.log('  ⊙ Already has embedding, using existing');
        result.images.push({
          id: item.id,
          url: item.url,
          caption: item.caption || '',
          alt: item.alt || '',
          embedding: existingEmbeddings.get(item.url)
        });
        skipCount++;
        continue;
      }

      // Load image or extract video frame
      const imageUrl = `http://localhost:${PORT}/assets/${item.url}`;
      const localPath = path.join(__dirname_root, 'public/assets', item.url);

      let image;
      if (isVideoFile(item.url)) {
        console.log(`  → Video detected, extracting first frame...`);
        image = await extractFirstFrame(localPath);
      } else {
        console.log(`  → Loading image from: /assets/${item.url}`);
        image = await RawImage.fromURL(imageUrl);
      }

      // Process image with CLIP
      console.log(`  → Processing with CLIP...`);
      const image_inputs = await processor(image);

      // Generate embedding
      const { image_embeds } = await model(image_inputs);
      const embedding = Array.from(image_embeds.data);

      console.log(`  ✓ Generated ${embedding.length}-dim embedding`);

      result.images.push({
        id: item.id,
        url: item.url,
        caption: item.caption || '',
        alt: item.alt || '',
        embedding: embedding
      });

      successCount++;

      // Save progress every 10 images
      if (successCount % 10 === 0 || index === imageItems.length - 1) {
        const outputPath = path.join(__dirname_root, 'data/image-embeddings.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`  💾 Progress saved (${index + 1}/${imageItems.length})`);
      }

    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      errorCount++;

      // Add empty entry to maintain structure
      result.images.push({
        id: item.id,
        url: item.url,
        caption: item.caption || '',
        alt: item.alt || '',
        embedding: []
      });
    }

    console.log();
  }

  // Final save
  const outputPath = path.join(__dirname_root, 'data/image-embeddings.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  console.log('-'.repeat(60));
  console.log('Summary:');
  console.log(`  ✓ Generated: ${successCount} new embeddings`);
  console.log(`  ⊙ Skipped: ${skipCount} (already existed)`);
  console.log(`  ✗ Errors: ${errorCount}`);
  console.log(`  Total images: ${imageItems.length}`);
  console.log();
  console.log(`💾 Saved to: ${outputPath}`);
  console.log();
  console.log('Next step: Restart your server to use the new embeddings.');
}

startServer().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
