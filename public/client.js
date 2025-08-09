  /// ----------------------------------------------------------- SEARCH COMPLETION VARIABLE DECLARATION
  let suggestionsList;
let suggestionTimeout;
const SUGGESTION_DELAY = 300; // milliseconds to wait before fetching suggestions
  /// ----------------------------------------------------------- SEARCH COMPLETION VARIABLE DECLARATION


// Client-side JavaScript for image search
document.addEventListener("DOMContentLoaded", function () {
 
  // Get references to DOM elements
  const searchInput = document.querySelector("#searchInput");
  const searchButton = document.querySelector("#searchBtn");
  const resultsDiv = document.querySelector("#imageSearchScreen");
  const title = document.querySelector("#title");
  const statusElement = document.querySelector("#status");

   /// ----------------------------------------------------------- SEARCH COMPLETION logic
// Create and add suggestions container
suggestionsList = document.createElement("div");
suggestionsList.id = "suggestionsList";
suggestionsList.className = "suggestions-list";
searchInput.parentNode.insertBefore(suggestionsList, searchInput.nextSibling);

// Add event listener for input changes to show suggestions
searchInput.addEventListener("input", handleInputChange);

// Add event listener to hide suggestions when clicking outside
document.addEventListener("click", function(event) {
  if (event.target !== searchInput && event.target !== suggestionsList) {
    hideSuggestions();
  }
});

// Add keyboard navigation for suggestions
searchInput.addEventListener("keydown", handleKeyNavigation);


  // Add event listener for search button (default to work search)
  searchButton.addEventListener("click", function() { searchWorks(); });

  // Navigation functionality
  const navWorks = document.getElementById("navWorks");
  const navImages = document.getElementById("navImages");
  const navAbout = document.getElementById("navAbout");

  // Set up navigation event listeners
  if (navWorks) {
    navWorks.addEventListener("click", function(e) {
      e.preventDefault();
      switchToWorksMode();
    });
  }

  if (navImages) {
    navImages.addEventListener("click", function(e) {
      e.preventDefault();
      switchToImagesMode();
    });
  }

  if (navAbout) {
    navAbout.addEventListener("click", function(e) {
      e.preventDefault();
      window.open("about.html", "_blank");
    });
  }

  // Switch to works search mode
  function switchToWorksMode() {
    // Update navigation styling
    document.querySelectorAll('.navOption').forEach(nav => nav.classList.remove('selectedNavOption'));
    navWorks.classList.add('selectedNavOption');
    
    // Update search button
    searchButton.textContent = "Search Works";
    searchButton.onclick = function() { searchWorks(); };
    
    // Auto-search if there's a query in the input
    const currentQuery = searchInput.value.trim();
    if (currentQuery) {
      updateStatus("Switching to works search...");
      searchWorks();
    } else {
      // Clear results and update status
      resultsDiv.innerHTML = "";
      updateStatus("Ready to search works!");
    }
  }

  // Switch to images search mode
  function switchToImagesMode() {
    // Update navigation styling
    document.querySelectorAll('.navOption').forEach(nav => nav.classList.remove('selectedNavOption'));
    navImages.classList.add('selectedNavOption');
    
    // Update search button
    searchButton.textContent = "Image Search";
    searchButton.onclick = function() { searchImages(); };
    
    // Auto-search if there's a query in the input
    const currentQuery = searchInput.value.trim();
    if (currentQuery) {
      updateStatus("Switching to image search...");
      searchImages();
    } else {
      // Clear results and update status
      resultsDiv.innerHTML = "";
      updateStatus("Ready to search images!");
    }
  }

  // Function to update status
  function updateStatus(message) {
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  // Function to search works (new primary search)
  async function searchWorks() {
    // Show loading state
    updateStatus("Searching...");
    resultsDiv.innerHTML = "";

    workSearchFormat();

    // Get query text
    const query = searchInput.value.trim();
    if (!query) {
      updateStatus("Please enter a search term");
      return;
    }

    try {
      // Send search request to the server
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query,
          searchType: "multimodal",
          maxResults: 20
        }),
      });

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data = await response.json();

      // Display results
      if (data.results && data.results.length > 0) {
        data.results.forEach((result) => {
          const workDiv = createWorkResultElement(result);
          resultsDiv.appendChild(workDiv);
        });

        // Show results area
        resultsDiv.style.display = "block";
        updateStatus(`Found ${data.results.length} works`);
      } else {
        updateStatus("No works found");
      }
    } catch (error) {
      console.error("Error during search:", error);
      updateStatus("Error searching for works");
    }
  }

  // Function to search images (legacy)
  async function searchImages() {
    // Show loading state
    updateStatus("Searching...");
    resultsDiv.innerHTML = "";

    imageSearchFormat();

    // Get query text
    const query = searchInput.value.trim();
    if (!query) {
      updateStatus("Please enter a search term");
      return;
    }

    try {
      // Send search request to the server
      const response = await fetch("/api/search/images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data = await response.json();

      // Display results
      if (data.results && data.results.length > 0) {
        data.results.forEach((result) => {
          // Create result container
          const resultDiv = document.createElement("div");
          resultDiv.className = "result-item";
          resultDiv.style.margin = "20px";

          // Create image element
          const img = document.createElement("img");
          img.src = result.url;
          img.style.width = "200px";
          img.style.height = "auto";
          img.style.border = "1px blue solid";

          // Create score element
          const captionP = document.createElement("p");
          captionP.className = "image-caption";
          captionP.textContent = truncateText(result.caption, 30);

          // Get dimensions and filesize once the image loads
          img.onload = function () {
            const width = this.naturalWidth;
            const height = this.naturalHeight;
            const fileSize = estimateFileSize(width, height);

            // Update the metadata element with actual dimensions
            const metadataElement = resultDiv.querySelector(".imageMeta");
            if (metadataElement) {
              metadataElement.textContent = `${width} x ${height} - ${fileSize} - jpg`;
            }
          };
          // Create wrapper for caption and metadata
          const infoDiv = document.createElement("div");
          infoDiv.className = "imageInfo";
          // Create caption with truncation
          const captionDiv = document.createElement("div");
          captionDiv.className = "imageCaption";
          captionDiv.textContent = truncateText(result.caption, 60);

          // Create metadata element (with placeholder until image loads)
          const metaDiv = document.createElement("div");
          metaDiv.className = "imageMeta";
          metaDiv.textContent = "-- x -- - --k - jpg";

          // Create source element
          const sourceDiv = document.createElement("div");
          sourceDiv.className = "imageSource";

          // Extract domain from URL or use placeholder
          const domain = extractDomain(result.url);
          sourceDiv.textContent = domain;

          // Create source link
          const sourceLink = document.createElement("a");
          sourceLink.className = "image-source";
          sourceLink.href = result.sourceUrl || "#";
          sourceLink.textContent = truncateText(result.domain || "unknown", 25);

          // Add elements to the DOM
          infoDiv.appendChild(captionDiv);
          infoDiv.appendChild(metaDiv);
          infoDiv.appendChild(sourceDiv);

          resultDiv.appendChild(img);
          resultDiv.appendChild(infoDiv);
          resultsDiv.appendChild(resultDiv);
        });

        // Show results area
        resultsDiv.style.display = "flex";
        updateStatus("Results found!");
      } else {
        updateStatus("No results found");
      }
    } catch (error) {
      console.error("Error during search:", error);
      updateStatus("Error searching for images");
    }
  }

  // Initialize
  updateStatus("Ready to search!");


  function truncateText(text, maxLength) {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  // Estimate file size based on dimensions (very rough approximation)
  function estimateFileSize(width, height) {
    // Simple estimation: width * height * 3 bytes (RGB) / 1024 for KB
    const sizeInKB = Math.round((width * height * 3) / 1024);
    return `${sizeInKB}k`;
  }

  // Extract domain from URL or use a placeholder
  function extractDomain(url) {
    if (!url) return "unknown";

    try {
      // For local files, use a placeholder
      if (url.startsWith("images/")) {
        return "www.example.com";
      }

      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return "www.example.com";
    }
  }

  // Create work result element with 2007 Google styling
  function createWorkResultElement(work) {
    const workDiv = document.createElement("div");
    workDiv.className = "work-result";
    
    // Create thumbnail container
    const thumbnailDiv = document.createElement("div");
    thumbnailDiv.className = "work-thumbnail";
    
    if (work.thumbnailImage) {
      const thumbnailImg = document.createElement("img");
      thumbnailImg.src = work.thumbnailImage;
      thumbnailImg.alt = work.title || "Work thumbnail";
      thumbnailImg.className = "work-thumbnail-img";
      thumbnailDiv.appendChild(thumbnailImg);
    } else {
      // Placeholder for works without thumbnails
      const placeholder = document.createElement("div");
      placeholder.className = "work-thumbnail-placeholder";
      placeholder.textContent = "No Image";
      thumbnailDiv.appendChild(placeholder);
    }
    
    // Create content container
    const contentDiv = document.createElement("div");
    contentDiv.className = "work-content";
    
    // Title link (Google blue)
    const titleLink = document.createElement("a");
    titleLink.href = work.url || "#";
    titleLink.className = "work-title";
    titleLink.textContent = work.title || "Untitled Work";
    
    // URL display (Google green)
    const urlDiv = document.createElement("div");
    urlDiv.className = "work-url";
    urlDiv.textContent = `guccione.com${work.url || ""}`;
    
    // Description (Google gray)
    const descDiv = document.createElement("div");
    descDiv.className = "work-description";
    descDiv.textContent = truncateText(work.description || "", 160);
    
    // Metadata (year, medium, tags)
    const metaDiv = document.createElement("div");
    metaDiv.className = "work-meta";
    const mediumText = Array.isArray(work.medium) ? work.medium.join(", ") : (work.medium || "");
    const yearText = work.year || "";
    if (yearText && mediumText) {
      metaDiv.textContent = `${yearText} • ${mediumText}`;
    } else if (yearText) {
      metaDiv.textContent = yearText;
    } else if (mediumText) {
      metaDiv.textContent = mediumText;
    }
    
    // Add score for debugging (can be removed in production)
    if (work.score && work.score > 0) {
      const scoreDiv = document.createElement("div");
      scoreDiv.className = "work-score";
      scoreDiv.textContent = `Relevance: ${(work.score * 100).toFixed(1)}%`;
      metaDiv.appendChild(document.createElement("br"));
      metaDiv.appendChild(scoreDiv);
    }
    
    // Add content to content container
    contentDiv.appendChild(titleLink);
    contentDiv.appendChild(urlDiv);
    contentDiv.appendChild(descDiv);
    contentDiv.appendChild(metaDiv);
    
    // Add thumbnail and content to main container
    workDiv.appendChild(thumbnailDiv);
    workDiv.appendChild(contentDiv);
    
    return workDiv;
  }

  function workSearchFormat() {
    // Get references to elements
    const homeScreen = document.getElementById("homeScreen");
    const searchItemsWrapper = document.getElementById("searchItemsWrapper");
    const imageSearchScreen = document.getElementById("imageSearchScreen");
    const title = document.getElementById("title");
    const searchContainer = document.getElementById("homeScreenSearchContainer");
    const navBar = document.getElementById("homeScreenNav");
    const btnContainer = document.getElementById("btnContainer");
    const luckyBtn = document.getElementById("luckyBtn");
    const searchBtn = document.getElementById("searchBtn");
    
    // Adjust home screen wrapper
    homeScreen.style.padding = "10px 0 0 10px";
    homeScreen.style.display = "flex";
    homeScreen.style.height = "10vh";

    searchItemsWrapper.style.flexDirection = "row";
    searchItemsWrapper.style.marginTop = "10vh";

    searchContainer.style.flexDirection = "row";
    searchContainer.style.alignItems = "center";
    searchContainer.style.marginTop = "2vh";

    searchInput.style.margin = "0";
    searchBtn.style.margin = "0";
    searchBtn.style.marginLeft = "5px";
    
    // Adjust title/logo
    title.style.justifyContent = "flex-start";
    title.style.marginBottom = "10px";
    title.style.marginTop = "30px";
    
    // Adjust logo image
    const logoImg = title.querySelector("img");
    if (logoImg) {
      logoImg.style.width = "400px";
      logoImg.style.margin = "0";
    }
    
    // Move navigation bar to top
    navBar.style.position = "absolute";
    navBar.style.top = "0";
    navBar.style.padding = "5px 10px";
    navBar.style.borderBottom = "1px solid #e5e5e5";
    
    // Adjust search container
    searchContainer.style.width = "500px";
    searchContainer.style.alignItems = "flex-start";
    searchContainer.style.marginLeft = "10px";
    
    // Adjust search button text
    searchBtn.textContent = "Search Works";
    
    // Hide the "I'm Feeling Lucky" button
    luckyBtn.style.display = "none";
    
    // Show work search results area
    imageSearchScreen.style.marginTop = "150px";
    imageSearchScreen.style.display = "block";
    imageSearchScreen.style.justifyContent = "flex-start";
    imageSearchScreen.style.paddingLeft = "20px";
    imageSearchScreen.style.paddingRight = "20px";
    imageSearchScreen.style.maxWidth = "800px";
    
    // Adjust footer info position
    const footerInfo = document.getElementById("homeScreenInfo");
    if (footerInfo) {
      footerInfo.style.display = "none";
    }
  }

  function imageSearchFormat() {
    // Get references to elements
    const homeScreen = document.getElementById("homeScreen");
    const searchItemsWrapper = document.getElementById("searchItemsWrapper");
    const imageSearchScreen = document.getElementById("imageSearchScreen");
    const title = document.getElementById("title");
    const searchContainer = document.getElementById("homeScreenSearchContainer");
    const navBar = document.getElementById("homeScreenNav");
    const btnContainer = document.getElementById("btnContainer");
    const luckyBtn = document.getElementById("luckyBtn");
    const searchBtn = document.getElementById("searchBtn");
    
    // Adjust home screen wrapper
    homeScreen.style.padding = "10px 0 0 10px";
    homeScreen.style.display = "flex";
    homeScreen.style.height = "10vh";

    searchItemsWrapper.style.flexDirection = "row";
    searchItemsWrapper.style.marginTop = "10vh";

    searchContainer.style.flexDirection = "row";
    searchContainer.style.alignItems = "center";
    searchContainer.style.marginTop = "2vh";

    searchInput.style.margin = "0";
    searchBtn.style.margin = "0";
    searchBtn.style.marginLeft = "5px";
    
    // Adjust title/logo
    title.style.justifyContent = "flex-start";
    title.style.marginBottom = "10px";
    title.style.marginTop = "30px";
    
    // Adjust logo image
    const logoImg = title.querySelector("img");
    if (logoImg) {
      logoImg.style.width = "400px";
      logoImg.style.margin = "0";
    }
    
    // Move navigation bar to top
    navBar.style.position = "absolute";
    navBar.style.top = "0";
    navBar.style.padding = "5px 10px";
    navBar.style.borderBottom = "1px solid #e5e5e5";
    
    // Adjust search container
    searchContainer.style.width = "500px";
    searchContainer.style.alignItems = "flex-start";
    searchContainer.style.marginLeft = "10px";
    
    // Adjust search button text
    searchBtn.textContent = "Image Search";
    
    // Hide the "I'm Feeling Lucky" button
    luckyBtn.style.display = "none";
    
    // Show image search results area
    imageSearchScreen.style.marginTop = "150px";
    imageSearchScreen.style.display = "flex";
    imageSearchScreen.style.justifyContent = "flex-start";
    imageSearchScreen.style.paddingLeft = "20px";
    
    // Adjust footer info position
    const footerInfo = document.getElementById("homeScreenInfo");
    if (footerInfo) {
      footerInfo.style.display = "none";
    }
  }
});


// ---------------------------------------------- SEARCH COMPLETION logic
// Handle input change with debounce
function handleInputChange() {
  const query = searchInput.value.trim();
  
  // Clear previous timeout
  if (suggestionTimeout) {
    clearTimeout(suggestionTimeout);
  }
  
  // Hide suggestions if query is empty
  if (!query) {
    hideSuggestions();
    return;
  }
  
  // Set timeout to fetch suggestions
  suggestionTimeout = setTimeout(() => {
    fetchSuggestions(query);
  }, SUGGESTION_DELAY);
}

// Fetch suggestions from server
async function fetchSuggestions(query) {
  try {
    const response = await fetch(`/api/suggestions?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch suggestions");
    }
    
    const data = await response.json();
    displaySuggestions(data.suggestions, query);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    hideSuggestions();
  }
}

// Display suggestions in the UI
function displaySuggestions(suggestions, query) {
  // Clear previous suggestions
  suggestionsList.innerHTML = "";
  
  // Hide if no suggestions
  if (!suggestions || suggestions.length === 0) {
    hideSuggestions();
    return;
  }
  
  // Create suggestion items
  suggestions.forEach((suggestion, index) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.dataset.index = index;
    
    // Highlight the matching part of the suggestion
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const highlightedText = suggestion.query.replace(
      regex, 
      '<span class="highlight">$1</span>'
    );
    
    item.innerHTML = highlightedText;
    
    // Add click event to select this suggestion
    item.addEventListener("click", () => {
      selectSuggestion(suggestion.query);
    });
    
    suggestionsList.appendChild(item);
  });
  
  // Show the suggestions list
  suggestionsList.style.display = "block";
}

// Helper function to escape special characters in regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Hide suggestions
function hideSuggestions() {
  suggestionsList.style.display = "none";
}

// Select a suggestion
function selectSuggestion(text) {
  searchInput.value = text;
  hideSuggestions();
  // Get the current search function from the button onclick
  const searchButton = document.querySelector("#searchBtn");
  if (searchButton && searchButton.onclick) {
    searchButton.onclick();
  }
}

// Handle keyboard navigation
function handleKeyNavigation(event) {
  const items = document.querySelectorAll('.suggestion-item');
  if (!items.length || suggestionsList.style.display === 'none') return;
  
  // Find the currently selected item (if any)
  const selected = document.querySelector('.suggestion-item.selected');
  const selectedIndex = selected ? parseInt(selected.dataset.index) : -1;
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      // Select next item or first if none selected
      if (selectedIndex < items.length - 1) {
        if (selected) selected.classList.remove('selected');
        items[selectedIndex + 1].classList.add('selected');
      } else if (selectedIndex === -1 && items.length > 0) {
        items[0].classList.add('selected');
      }
      break;
      
    case 'ArrowUp':
      event.preventDefault();
      // Select previous item or last if none selected
      if (selectedIndex > 0) {
        if (selected) selected.classList.remove('selected');
        items[selectedIndex - 1].classList.add('selected');
      } else if (selectedIndex === -1 && items.length > 0) {
        items[items.length - 1].classList.add('selected');
      }
      break;
      
    case 'Enter':
      // If an item is selected, use it
      if (selected) {
        event.preventDefault();
        selectSuggestion(selected.textContent);
      }
      break;
      
    case 'Escape':
      // Hide suggestions
      hideSuggestions();
      break;
  }
}