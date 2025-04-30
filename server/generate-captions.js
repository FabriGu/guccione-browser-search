// generateCaptions.js
import express from 'express';
import { Florence2ForConditionalGeneration, AutoProcessor, AutoTokenizer, RawImage } from '@huggingface/transformers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
let __dirname = path.dirname(fileURLToPath(import.meta.url));
__dirname = __dirname + "/.."
const PORT = 3001;

// Function to load image catalog
async function loadImageCatalog() {
  try {
    const catalogPath = path.join(__dirname, 'data/image-catalog.json');
    console.log(`Loading catalog from: ${catalogPath}`);
    const rawData = fs.readFileSync(catalogPath, 'utf8');
    return JSON.parse(rawData).images;
  } catch (error) {
    console.error(`Error reading image catalog: ${error.message}`);
    return [];
  }
}

// Function to clean up caption text
function cleanCaption(text) {
  return text
    .replace(/<[^>]+>/g, '')  // Remove all tags like <loc_999>
    .replace(/BRIEF_CAPTION/g, '')  // Remove the prompt name
    .replace(/MORE_DETAILED_CAPTION/g, '')  // Remove the prompt name
    .replace(/poly/g, '')  // Remove any lingering 'poly' mentions
    .replace(/\s+/g, ' ')  // Collapse multiple spaces
    .trim();  // Remove leading/trailing spaces
}

async function startServer() {
  console.log('Starting image captioning server...');
  
  // Set up Express server
  const app = express();
  
  // Serve static files from public directory
  app.use('/public', express.static(path.join(__dirname, 'public')));
  
  // Start the server
  const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    processImages()
      .then(() => {
        console.log('Image processing complete. Shutting down server...');
        server.close();
      })
      .catch(error => {
        console.error('Error during image processing:', error);
        server.close();
      });
  });
}

async function processImages() {
  // Load model, processor, and tokenizer
  console.log('Loading model, processor, and tokenizer...');
  const model_id = 'onnx-community/Florence-2-base-ft';
  const model = await Florence2ForConditionalGeneration.from_pretrained(model_id, { dtype: 'fp32' });
  const processor = await AutoProcessor.from_pretrained(model_id);
  const tokenizer = await AutoTokenizer.from_pretrained(model_id);
  console.log('Models loaded successfully');
  
  // Load the image catalog
  const imageItems = await loadImageCatalog();
  console.log(`Found ${imageItems.length} images in catalog`);
  
  if (imageItems.length === 0) {
    console.log('No images found in the catalog');
    return;
  }
  
  // Prepare the result object - using the same structure as your existing catalog
  const result = {
    images: []
  };
  
  // Process each image
  for (const [index, item] of imageItems.entries()) {
    try {
      console.log(`Processing image ${index + 1}/${imageItems.length}: ${item.id}`);
      
      // Create URL to the local server
      const imageUrl = `http://localhost:${PORT}/public/${item.url}`;
      
      // Load image from URL
      const image = await RawImage.fromURL(imageUrl);
      
      // Process the image
      const vision_inputs = await processor(image);
      
      // Use brief caption task
      const task = '<MORE_DETAILED_CAPTION>';
      const prompts = processor.construct_prompts(task);
      const text_inputs = tokenizer(prompts);
      
      // Generate caption
      const generated_ids = await model.generate({
        ...text_inputs,
        ...vision_inputs,
        max_new_tokens: 30,
      });
      
      // Decode generated text - use skip_special_tokens: true
      const generated_text = tokenizer.batch_decode(generated_ids, { skip_special_tokens: true })[0];
      
      // Get caption text and clean it
      let captionText;
      
      try {
        // Try the post-processing approach first
        const captionResult = processor.post_process_generation(generated_text, task, image.size);
        if (captionResult && captionResult[task]) {
          captionText = captionResult[task];
        } else {
          // If that doesn't work, use manual cleaning
          captionText = cleanCaption(generated_text);
        }
      } catch (error) {
        console.log(`Post-processing error for ${item.id}, using manual cleanup: ${error.message}`);
        captionText = cleanCaption(generated_text);
      }
      
      // Make sure we have a clean, readable caption
      if (!captionText || captionText.includes('<loc_') || captionText.includes('poly')) {
        captionText = cleanCaption(generated_text);
      }
      
      console.log(`Generated text: ${generated_text.substring(0, 100)}...`);
      console.log(`Cleaned caption: ${captionText}`);
      
      // Add to results - maintaining your existing structure
      result.images.push({
        id: item.id,
        url: item.url,
        caption: captionText
      });
      
      // Save progress every 5 images or on the last image
      if (index % 5 === 4 || index === imageItems.length - 1) {
        const outputPath = path.join(__dirname, 'data/image-captions.json');
        await fs.promises.writeFile(outputPath, JSON.stringify(result, null, 2));
        console.log(`Progress saved (${index + 1}/${imageItems.length} images)`);
      }
      
    } catch (error) {
      console.error(`Error processing image ${item.id}: ${error.message}`);
      // Add to results with empty caption to maintain structure
      result.images.push({
        id: item.id,
        url: item.url,
        caption: ""
      });
    }
  }
  
  // Final save
  const outputPath = path.join(__dirname, 'data/image-captions.json');
  await fs.promises.writeFile(outputPath, JSON.stringify(result, null, 2));
  console.log(`All done! Captions saved to ${outputPath}`);
  
  return result;
}

// Start the server and process images
startServer()
  .catch(error => console.error('Error in main process:', error));