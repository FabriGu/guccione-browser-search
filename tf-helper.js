// Global variables
let tfjs;
let textModel, visionModel, tokenizer, processor, cos_sim;


// Load CLIP models
async function loadModels() {
  
  // Load transformers.js library
  tfjs = await import(
    "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.4.0"
  );
  
  // Destructure things we need
  const {
    AutoTokenizer,
    AutoProcessor,
    CLIPTextModelWithProjection,
    CLIPVisionModelWithProjection,
    RawImage,
  } = tfjs;

  statusText = "Loading CLIP model...";

  // Load text model
  tokenizer = await AutoTokenizer.from_pretrained(
    "Xenova/clip-vit-base-patch16"
  );
  textModel = await CLIPTextModelWithProjection.from_pretrained(
    "Xenova/clip-vit-base-patch16",
    {
      device: "webgpu",
      dtype: "fp32",
      progress_callback: logProgress,
    }
  );

  // Load vision model
  processor = await AutoProcessor.from_pretrained(
    "Xenova/clip-vit-base-patch16"
  );
  visionModel = await CLIPVisionModelWithProjection.from_pretrained(
    "Xenova/clip-vit-base-patch16",
    {
      device: "webgpu",
      dtype: "fp32",
      progress_callback: logProgress,
    }
  );
}

// A single image embedding
async function computeImageEmbedding(imgURL) {
  const image = await tfjs.RawImage.read(imgURL);
  const imageInputs = await processor(image);
  const { image_embeds } = await visionModel(imageInputs);
  const embedding = image_embeds.normalize().tolist()[0];
  return embedding;
}

// A single text embedding
async function computeTextEmbedding(query) {
  // Compute text embedding
  const textInputs = tokenizer([query], { padding: true, truncation: true });
  const { text_embeds } = await textModel(textInputs);
  const embedding = text_embeds.normalize().tolist()[0];
  return embedding;
}
