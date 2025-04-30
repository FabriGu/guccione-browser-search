// generate-image-catalog.js
const fs = require('fs');
const path = require('path');

/**
 * Creates a JSON file containing image paths from a specified directory
 * @param {string} directoryPath - Path to the directory containing images
 * @param {string} outputPath - Path where the JSON file will be saved
 * @param {Array<string>} [extensions=['jpg', 'jpeg', 'png', 'gif', 'webp']] - Image file extensions to include
 */
function generateImageCatalog(directoryPath, outputPath, extensions) {
  // Ensure directory path exists
  if (!fs.existsSync(directoryPath)) {
    console.error(`Error: Directory not found: ${directoryPath}`);
    process.exit(1);
  }

  // Read all files in the directory
  const files = fs.readdirSync(directoryPath);
  
  // Filter for image files based on extensions
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase().substring(1);
    return extensions.includes(ext);
  });

  console.log(`Found ${imageFiles.length} image files in ${directoryPath}`);

  // Create the catalog object
  const catalog = {
    images: imageFiles.map((file, index) => ({
      id: index.toString(),
      url: path.join(directoryPath, file).replace(/\\/g, '/')
    }))
  };

  // Write the catalog to a JSON file
  fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2));
  
  console.log(`Image catalog created at: ${outputPath}`);
}

// Get command line arguments
const args = process.argv.slice(2);
const directoryPath = args[0] || './images';
const outputPath = args[1] || 'image-catalog.json';
const extensions = args[2] ? args[2].split(',') : ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// Run the function
generateImageCatalog(directoryPath, outputPath, extensions);