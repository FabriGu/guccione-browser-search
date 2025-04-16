// Machine Learning for Creative Coding
// https://github.com/shiffman/ML-for-Creative-Coding

// All image embeddings
let imageEmbeddings = [];

// Interface
let textInput, searchButton, resultsDiv;

// Navigation elements
let navImages, navTexts;

// Current mode
let currentMode = "images"; // Default mode

// get references from index.html
textInput = document.querySelector("#searchInput");
searchButton = document.querySelector("#searchBtn");
resultsDiv = document.querySelector("#imageSearchScreen");
navImages = document.querySelector("#navImages");
navTexts = document.querySelector("#navTexts");

let title = document.querySelector("#title");

// Set up navigation
navImages.addEventListener("click", function(e) {
  e.preventDefault();
  switchMode("images");
});

navTexts.addEventListener("click", function(e) {
  e.preventDefault();
  switchMode("texts");
});

// Function to switch modes
function switchMode(mode) {
  currentMode = mode;
  
  // Update nav styling
  navImages.style.fontWeight = (mode === "images") ? "bold" : "normal";
  navTexts.style.fontWeight = (mode === "texts") ? "bold" : "normal";
  
  // Reset the UI
  textInput.value = "";
  resultsDiv.innerHTML = "";
  title.style.display = "flex";
  
  // Update button text based on mode
  if (mode === "images") {
    searchButton.textContent = "Guccione Search";
    textInput.placeholder = "Search images...";
  } else {
    searchButton.textContent = "Search Texts";
    textInput.placeholder = "Ask a question...";
  }
  
  // Update the search button click event
  searchButton.removeEventListener("click", searchImages);
  searchButton.removeEventListener("click", searchTexts);
  
  if (mode === "images") {
    searchButton.addEventListener("click", searchImages);
  } else {
    searchButton.addEventListener("click", searchTexts);
  }
}

// Initial event listener setup
searchButton.addEventListener("click", searchImages);

async function setup() {
  createCanvas(310, 40);
  background(220);
  
  // Apply initial nav styling
  navImages.style.fontWeight = "bold";
  
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
  
  // Results
  resultsDiv = createDiv('');

  // Load models and compute embeddings
  await loadModels();
  
  // Update Canvas
  updateCanvas("Ready!");
}

// Image Search functionality
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

// Text Search functionality
async function searchTexts() {
  resultsDiv.html('');
  title.style.display = "none";
  
  const question = textInput.value.trim();
  if (question.length === 0) return;
  
  updateCanvas("Processing question...");
  
  // Create mock results for text search
  const resultsContainer = createDiv();
  resultsContainer.style("padding", "20px");
  resultsContainer.style("max-width", "800px");
  resultsContainer.style("margin", "0 auto");
  
  // Add some mock results
  for (let i = 0; i < 5; i++) {
    const resultElement = createDiv();
    resultElement.addClass("result-item");
    resultElement.style("margin-bottom", "20px");
    resultElement.style("padding", "15px");
    resultElement.style("background-color", "#f8f9fa");
    resultElement.style("border-radius", "8px");
    resultElement.style("border", "1px solid #dadce0");
    
    const resultText = createP(`<strong>Result ${i+1} for "${question}"</strong><br>
      This is a sample text search result that would match your query. 
      In a real implementation, this would be an actual text from your dataset.`);
      
    const scoreText = createP(`<em>Similarity: ${(0.9 - (i * 0.1)).toFixed(2)}</em>`);
    
    resultText.parent(resultElement);
    scoreText.parent(resultElement);
    resultElement.parent(resultsContainer);
  }
  
  resultsContainer.parent(resultsDiv);
  updateCanvas("Ready");
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