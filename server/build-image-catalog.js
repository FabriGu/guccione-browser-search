// server/build-image-catalog.js
// Dynamically build image-catalog.json from all project JSONs

const fs = require('fs');
const path = require('path');

const projectsDir = path.join(__dirname, '../data/projects');
const outputPath = path.join(__dirname, '../data/image-catalog.json');

console.log('='.repeat(60));
console.log('Building Image Catalog from Project JSONs');
console.log('='.repeat(60));
console.log();

// Read all JSON files from projects directory
const files = fs.readdirSync(projectsDir)
  .filter(file => file.endsWith('.json'))
  .filter(file => !file.startsWith('_')); // Exclude files starting with _

console.log(`Found ${files.length} project files`);
console.log();

const images = [];
const imageMap = new Map(); // Track images by URL for deduplication
let imageId = 0;

files.forEach(filename => {
  const filepath = path.join(projectsDir, filename);
  console.log(`Processing: ${filename}`);

  try {
    const project = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    let projectImageCount = 0;

    // Helper to add or update image
    const addImage = (url, caption = '', alt = '') => {
      if (!url) return;

      // Normalize path (remove leading slash, public/assets, etc)
      let normalized = url.replace(/^\/+/, '');
      normalized = normalized.replace(/^public\/assets\//, '');
      normalized = normalized.replace(/^assets\//, '');

      if (imageMap.has(normalized)) {
        // Image already exists - update caption/alt if new ones are better (non-empty)
        const existing = imageMap.get(normalized);
        if (caption && !existing.caption) {
          existing.caption = caption;
        }
        if (alt && !existing.alt) {
          existing.alt = alt;
        }
      } else {
        // New image - add it
        const imageData = {
          id: String(imageId++),
          url: normalized,
          caption: caption || '',
          alt: alt || ''
        };
        imageMap.set(normalized, imageData);
        images.push(imageData);
        projectImageCount++;
      }
    };

    // Add thumbnail (no caption/alt usually)
    if (project.thumbnail) {
      addImage(project.thumbnail, '', project.title); // Use project title as alt
    }

    // Add hero image (no caption/alt usually)
    if (project.content?.hero?.image) {
      const heroAlt = project.content?.hero?.alt || `${project.title} hero image`;
      addImage(project.content.hero.image, '', heroAlt);
    }

    // Add gallery images with captions and alt text
    if (project.content?.gallery?.images) {
      project.content.gallery.images.forEach(img => {
        if (img.src) {
          addImage(img.src, img.caption || '', img.alt || '');
        }
      });
    }

    console.log(`  ✓ Added ${projectImageCount} images from ${project.title}`);

  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
  }
});

console.log();

// Create catalog structure
const catalog = {
  images: images
};

// Write to file
fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2));

console.log('-'.repeat(60));
console.log('Summary:');
console.log(`  Projects processed: ${files.length}`);
console.log(`  Unique images: ${images.length}`);
console.log();
console.log(`💾 Saved to: ${outputPath}`);
console.log();
console.log('✅ Done! Now run: node server/generate-image-embeddings.js');
console.log('='.repeat(60));
