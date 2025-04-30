// generate-embeddings.js
const fs = require('fs');
const path = require('path');

// Import transformers.js using require
// Note: You'll need to install this package first with:
// npm install @huggingface/transformers

async function generateEmbeddings() {
  // Load the image catalog
  let imageCatalog;
  try {
    const rawJson = fs.readFileSync('image-catalog.json', 'utf8');
    imageCatalog = JSON.parse(rawJson);
  } catch (error) {
    console.error('Error loading image catalog:', error);
    process.exit(1);
  }

  console.log(`Found ${imageCatalog.images.length} images in catalog.`);

  // Load transformers.js
  const tfjs = await import('@huggingface/transformers');
  const {
    AutoProcessor,
    CLIPVisionModelWithProjection,
    RawImage,
  } = tfjs;

  console.log('Loading CLIP model...');
  
  // Load vision model
  const processor = await AutoProcessor.from_pretrained(
    "Xenova/clip-vit-base-patch16"
  );
  
  const visionModel = await CLIPVisionModelWithProjection.from_pretrained(
    "Xenova/clip-vit-base-patch16",
    { progress_callback: logProgress }
  );

  console.log('Models loaded successfully.');

  // Process all images
  const imageEmbeddings = [];
  for (let i = 0; i < imageCatalog.images.length; i++) {
    const { id, url } = imageCatalog.images[i];
    console.log(`Processing image ${i + 1}/${imageCatalog.images.length}: ${url}`);
    
    try {
      const image = await RawImage.read(url);
      const imageInputs = await processor(image);
      const { image_embeds } = await visionModel(imageInputs);
      const embedding = image_embeds.normalize().tolist()[0];
      
      imageEmbeddings.push({ id, url, embedding });
      console.log(`Successfully processed image ${id}`);
    } catch (error) {
      console.error(`Error processing image ${id} (${url}):`, error);
      // Add a placeholder empty embedding to maintain consistent indexing
      imageEmbeddings.push({ id, url, embedding: null });
    }
    
    // Save progress periodically (every 10 images)
    if ((i + 1) % 10 === 0 || i === imageCatalog.images.length - 1) {
      fs.writeFileSync('image-embeddings.json', JSON.stringify({ images: imageEmbeddings }, null, 2));
      console.log(`Progress saved: ${i + 1}/${imageCatalog.images.length} images`);
    }
  }

  // Final save
  fs.writeFileSync('image-embeddings.json', JSON.stringify({ images: imageEmbeddings }, null, 2));
  console.log(`All embeddings computed and saved to image-embeddings.json`);
}

// Log model loading progress
function logProgress(progress) {
  if (progress.status === "progress") {
    console.log(`Loading models: ${progress.progress.toFixed(0)}%`);
  }
}

// Run the function
generateEmbeddings().catch(error => {
  console.error('Error generating embeddings:', error);
});