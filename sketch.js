// Machine Learning for Creative Coding
// https://github.com/shiffman/ML-for-Creative-Coding

// List of all images
// let imageList;

// All image embeddings
let imageEmbeddings = [];

// Interface
let textInput, searchButton, resultsDiv;

// get references from index.html
textInput = document.querySelector("#searchInput");
searchButton = document.querySelector("#searchBtn");
resultsDiv = document.querySelector("#imageSearchScreen")
// console.log(textInput, searchButton, resultsDiv)

let title = document.querySelector("#title");


// add event listener for button to searchImages
searchButton.addEventListener("click", searchImages);

async function setup() {
  
  createCanvas(310, 40);
  background(220);
  
  // Load list of images
  // let rawjson = await loadJSON("image-catalog.json");
  // imageList = rawjson.images;


  // Update Canvas with loading message
  updateCanvas("Loading embeddings...");
  
  // Load pre-computed embeddings instead of computing them
  try {
    let response = await fetch("image-embeddings.json");
    let data = await response.json();
    imageEmbeddings = data.images;
    updateCanvas(`Loaded ${imageEmbeddings.length} image embeddings`);
  } catch (error) {
    console.error("Error loading embeddings:", error);
    updateCanvas("Error loading embeddings!");
  }
  
  
  // Text input
  // textInput = createInput("");
  // textInput.size(300);
  // searchButton = createButton("Search");
  // searchButton.mousePressed(searchImages);
  
  // Results
  resultsDiv = createDiv('');

  // Load models and compute embeddings
  await loadModels();
  // await computeEmbeddings();
  
  // Update Canvas
  updateCanvas("Ready!");
}


// Embeddings for all images
async function computeEmbeddings() {
  for (let i = 0; i < imageList.length; i++) {
    const { id, url } = imageList[i];
    updateCanvas(`Processing image ${i + 1}/${imageList.length}`);
    const embedding = await computeImageEmbedding(url);
    imageEmbeddings.push({ id, url, embedding });
  }
}

// Image Similirity
async function searchImages() {
  resultsDiv.html('');
  title.style.display = "none";


  // Get query text
  let query = "photo of " + textInput.value.trim();
  updateCanvas(`Searching for: ${query}`);
  
  // Get text embedding
  let textEmbedding = await computeTextEmbedding(query);

  // Calculate similarities
  let similarities = [];
  for (const item of imageEmbeddings) {
    const similarity = tfjs.cos_sim(textEmbedding, item.embedding);
    similarities.push({ item, similarity });
  }

  // Sort by similarity
  similarities.sort((a, b) => b.similarity - a.similarity);

  // Display results
  for (const result of similarities) {
    const resultDiv = createDiv();

    resultDiv.addClass("resultDiv");
    resultDiv.style("display", "inline-block");
    resultDiv.style("margin", "10px");
    const img = createImg(result.item.url, result.item.id);
    img.parent(resultDiv);
    img.size(200, AUTO);
    
    const scoreP = createP(`${result.similarity.toFixed(2)}`);
    scoreP.parent(resultDiv);
    resultDiv.parent(resultsDiv);
  }
  updateCanvas("Ready!");
}

// Log model loading
function logProgress(progress) {
  if (progress.status === "progress") {
    updateCanvas(`Loading models: ${progress.progress.toFixed(0)}%`);
  }
}

// Update text
function updateCanvas(statusText) {
  background(220);
  textSize(16);
  textAlign(CENTER,CENTER);
  fill(0);
  text(statusText, width / 2, height / 2);
}
