// server/build-works-index.js
// Dynamically build works.json from all project JSONs in data/projects/

const fs = require('fs');
const path = require('path');

const projectsDir = path.join(__dirname, '../data/projects');
const outputPath = path.join(__dirname, '../data/works.json');

console.log('='.repeat(60));
console.log('Building Works Index from Project JSONs');
console.log('='.repeat(60));
console.log();

// Read all JSON files from projects directory
const files = fs.readdirSync(projectsDir)
  .filter(file => file.endsWith('.json'))
  .filter(file => !file.startsWith('_')); // Exclude files starting with _

console.log(`Found ${files.length} project files:`);
files.forEach(file => console.log(`  - ${file}`));
console.log();

const works = [];
const categories = new Set();

files.forEach(filename => {
  const filepath = path.join(projectsDir, filename);
  console.log(`Processing: ${filename}`);

  try {
    const project = JSON.parse(fs.readFileSync(filepath, 'utf8'));

    // Extract images from project
    const images = [];

    // Add thumbnail
    if (project.thumbnail) {
      images.push(project.thumbnail);
    }

    // Add hero image
    if (project.content?.hero?.image) {
      images.push(project.content.hero.image);
    }

    // Add gallery images
    if (project.content?.gallery?.images) {
      project.content.gallery.images.forEach(img => {
        if (img.src) images.push(img.src);
      });
    }

    // Determine category from tags
    let category = 'digital_art'; // default
    if (project.tags) {
      if (project.tags.includes('wearable') || project.tags.includes('electronics')) {
        category = 'physical_computing';
      } else if (project.tags.includes('installation')) {
        category = 'installation';
      } else if (project.tags.includes('interactive') || project.tags.includes('web')) {
        category = 'interactive';
      }
    }
    categories.add(category);

    // Extract medium from tags
    const medium = project.tags ? project.tags.map(tag =>
      tag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    ) : [];

    // Build work entry
    const work = {
      id: project.id,
      title: project.title,
      description: project.description,
      year: project.year,
      medium: medium.slice(0, 3), // Take first 3 tags as medium
      status: 'completed',
      textContent: project.content?.overview?.longDescription || project.description,
      tags: project.tags || [],
      images: images,
      videos: [],
      thumbnailImage: project.thumbnail || images[0] || '',
      category: category,
      url: `/project.html?id=${project.id}`,
      featured: false,
      theme: project.theme || null,
      embedding: null,
      textEmbedding: null,
      imageEmbeddings: []
    };

    works.push(work);
    console.log(`  ✓ Added: ${work.title} (${images.length} images)`);

  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
  }

  console.log();
});

// Build categories array
const categoriesArray = Array.from(categories).map(cat => ({
  id: cat,
  name: cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
  count: works.filter(w => w.category === cat).length
}));

// Create works data structure
const worksData = {
  works: works,
  categories: categoriesArray
};

// Write to file
fs.writeFileSync(outputPath, JSON.stringify(worksData, null, 2));

console.log('-'.repeat(60));
console.log('Summary:');
console.log(`  Projects processed: ${files.length}`);
console.log(`  Works created: ${works.length}`);
console.log(`  Categories: ${categoriesArray.length}`);
categoriesArray.forEach(cat => {
  console.log(`    - ${cat.name}: ${cat.count} works`);
});
console.log();
console.log(`💾 Saved to: ${outputPath}`);
console.log();
console.log('✅ Done! Now run: node server/generate-text-embeddings.js');
console.log('='.repeat(60));
