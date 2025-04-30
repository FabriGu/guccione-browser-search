// generateCaptionsFromExisting.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// First, load the image embeddings to get the list of images
async function generateCaptionsForEmbeddings() {
  console.log('Loading image embeddings...');
  
  // Load existing image embeddings to get the list of images
  let imageEmbeddings;
  try {
    const embeddingsData = fs.readFileSync(path.join(__dirname, 'data/image-embeddings.json'), 'utf8');
    imageEmbeddings = JSON.parse(embeddingsData).images;
    console.log(`Found ${imageEmbeddings.length} images to caption`);
  } catch (error) {
    console.error('Error loading embeddings:', error);
    return;
  }
  
  // Create images directory if it doesn't exist
  const imagesDir = path.join(__dirname, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
  }
  
  // Create symlinks to the images from the embeddings
  for (const item of imageEmbeddings) {
    const { id, url } = item;
    if (url.startsWith('file://')) {
      const sourcePath = url.replace('file://', '');
      if (fs.existsSync(sourcePath)) {
        const extension = path.extname(sourcePath);
        const targetPath = path.join(imagesDir, `${id}${extension}`);
        console.log(`Creating symlink from ${sourcePath} to ${targetPath}`);
        try {
          if (!fs.existsSync(targetPath)) {
            fs.symlinkSync(sourcePath, targetPath);
          }
        } catch (error) {
          console.error(`Error creating symlink: ${error.message}`);
        }
      }
    }
  }
  
  // Run your existing captionServer.js
  console.log('Running caption server to generate captions...');
  try {
    execSync('node captionServer.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error running caption server:', error);
  }
  
  // Now captions.json should be generated, let's merge it with embeddings
  console.log('Merging captions with embeddings...');
  try {
    const captionsData = fs.readFileSync(path.join(__dirname, 'captions.json'), 'utf8');
    const captions = JSON.parse(captionsData);
    
    // Map captions to images by URL
    const captionMap = {};
    for (const image of captions.images) {
      if (image.url && image.caption) {
        captionMap[image.url] = image.caption;
      }
    }
    
    // Merge captions into embeddings
    const captionedImages = imageEmbeddings.map(item => {
      return {
        ...item,
        caption: captionMap[item.url] || "No caption available"
      };
    });
    
    // Save the merged data
    const outputPath = path.join(__dirname, 'data/image-embeddings-with-captions.json');
    fs.writeFileSync(outputPath, JSON.stringify({ images: captionedImages }, null, 2));
    console.log(`All done! Captions merged with embeddings and saved to ${outputPath}`);
    
  } catch (error) {
    console.error('Error merging captions with embeddings:', error);
  }
}

// Run the function
generateCaptionsForEmbeddings().catch(error => {
  console.error('Error in caption generation process:', error);
});