// // server/caption-service.js
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// // Caption data (will be loaded from file)
// let imageCaptions = {};

// // Load captions from file
// function loadCaptions() {
//   try {
//     // Try to load from image-captions.json
//     const captionsPath = path.join(__dirname, '../data/image-captions.json');
//     if (fs.existsSync(captionsPath)) {
//       const captionsData = fs.readFileSync(captionsPath, 'utf8');
//       const captionsObj = JSON.parse(captionsData);
      
//       // Convert to a map for faster lookup
//       imageCaptions = {};
//       captionsObj.images.forEach(item => {
//         imageCaptions[item.id] = item.caption || '';
//       });
      
//       console.log(`Loaded ${Object.keys(imageCaptions).length} image captions`);
//       return true;
//     }
//     return false;
//   } catch (error) {
//     console.error('Error loading captions:', error);
//     return false;
//   }
// }

// // Get caption for a specific image
// function getCaption(imageId) {
//   return imageCaptions[imageId] || '';
// }

// export { loadCaptions, getCaption };