// scripts/generate-captions.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Script to generate captions locally using Florence model
async function generateCaptions() {
  try {
    console.log('Starting caption generation...');
    
    // Load image catalog
    const catalogPath = path.join(__dirname, '../data/image-catalog.json');
    const catalogData = fs.readFileSync(catalogPath, 'utf8');
    const imageItems = JSON.parse(catalogData).images;
    console.log(`Found ${imageItems.length} images in catalog`);
    
    // Prepare results array
    const results = {
      images: []
    };
    
    // Load Florence model (only locally, never pushed to server)
    console.log('Loading Florence model for caption generation...');
    const { Florence2ForConditionalGeneration, AutoProcessor, AutoTokenizer, RawImage } = 
      await import('@huggingface/transformers');
      
    const model_id = 'onnx-community/Florence-2-base-ft';
    const model = await Florence2ForConditionalGeneration.from_pretrained(model_id, { dtype: 'fp32' });
    const processor = await AutoProcessor.from_pretrained(model_id);
    const tokenizer = await AutoTokenizer.from_pretrained(model_id);
    console.log('Florence model loaded');
    
    // Process each image
    for (let i = 0; i < imageItems.length; i++) {
      const item = imageItems[i];
      console.log(`Processing image ${i + 1}/${imageItems.length}: ${item.id}`);
      
      try {
        // Load image
        const imagePath = path.join(__dirname, '..', item.url);
        const image = await RawImage.read(imagePath);
        
        // Process image
        const vision_inputs = await processor(image);
        
        // Generate caption
        const task = '<MORE_DETAILED_CAPTION>';
        const prompts = processor.construct_prompts(task);
        const text_inputs = tokenizer(prompts);
        
        const generated_ids = await model.generate({
          ...text_inputs,
          ...vision_inputs,
          max_new_tokens: 30,
        });
        
        // Get caption
        const generated_text = tokenizer.batch_decode(generated_ids, { skip_special_tokens: true })[0];
        let caption = generated_text
          .replace(/<[^>]+>/g, '')
          .replace(/MORE_DETAILED_CAPTION/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        console.log(`Generated caption: ${caption.substring(0, 100)}...`);
        
        // Add to results
        results.images.push({
          id: item.id,
          url: item.url,
          caption: caption
        });
        
        // Save progress periodically
        if (i % 5 === 4 || i === imageItems.length - 1) {
          fs.writeFileSync(
            path.join(__dirname, '../data/image-captions.json'),
            JSON.stringify(results, null, 2)
          );
          console.log(`Progress saved: ${i + 1}/${imageItems.length} images`);
        }
      } catch (error) {
        console.error(`Error processing image ${item.id}:`, error);
        results.images.push({
          id: item.id,
          url: item.url,
          caption: ''
        });
      }
    }
    
    console.log('Caption generation complete!');
  } catch (error) {
    console.error('Error during caption generation:', error);
  }
}

// Run the script
generateCaptions();