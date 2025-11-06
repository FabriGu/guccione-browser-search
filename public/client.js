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
  const worksResultsDiv = document.querySelector("#worksResultsScreen");
  const imagesResultsDiv = document.querySelector("#imageSearchScreen");
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


  // Set initial search button behavior (default to work search)
  // Note: Using onclick instead of addEventListener to allow mode switching to override
  searchButton.onclick = function() {
    // Check if input is empty or only contains spaces
    if (!searchInput.value.trim()) {
      return; // Don't search if input is empty or only spaces
    }
    searchWorks();
  };

  // Add event listener for "I'm Feeling Lucky" button
  const luckyBtn = document.getElementById("luckyBtn");
  if (luckyBtn) {
    luckyBtn.addEventListener("click", async function() {
      const query = searchInput.value.trim();
      if (!query) {
        return; // Don't do anything if input is empty
      }

      try {
        // Show loading state
        updateStatus("Feeling lucky...");
        luckyBtn.disabled = true;

        // Perform search
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            searchType: "multimodal",
            maxResults: 1  // Only get the top result
          }),
        });

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const data = await response.json();

        // Navigate to the top result if it exists
        if (data.results && data.results.length > 0) {
          const topResult = data.results[0];
          updateStatus(`Taking you to: ${topResult.title}`);

          // Navigate to the work page after a brief delay
          setTimeout(() => {
            window.location.href = topResult.url;
          }, 500);
        } else {
          updateStatus("No results found for your query");
          luckyBtn.disabled = false;
        }
      } catch (error) {
        console.error("Error during 'I'm Feeling Lucky':", error);
        updateStatus("Error: Could not complete the search");
        luckyBtn.disabled = false;
      }
    });
  }

  // Make logo clickable to return to homepage
  const logoImg = document.querySelector("#title img");
  if (logoImg) {
    logoImg.style.cursor = "pointer";
    logoImg.addEventListener("click", function() {
      // Reset to homepage state
      returnToHome();
      resetLayoutToHomepage();
    });
  }

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
    searchButton.onclick = function() { 
      if (!searchInput.value.trim()) return;
      searchWorks(); 
    };
    
    // Auto-search if there's a query in the input
    const currentQuery = searchInput.value.trim();
    if (currentQuery) {
      updateStatus("Switching to works search...");
      searchWorks();
    } else {
      // Clear results and update status
      worksResultsDiv.innerHTML = "";
      imagesResultsDiv.style.display = "none";
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
    searchButton.onclick = function() { 
      if (!searchInput.value.trim()) return;
      searchImages(); 
    };
    
    // Auto-search if there's a query in the input
    const currentQuery = searchInput.value.trim();
    if (currentQuery) {
      updateStatus("Switching to image search...");
      searchImages();
    } else {
      // Clear results and update status
      imagesResultsDiv.innerHTML = "";
      worksResultsDiv.style.display = "none";
      updateStatus("Ready to search images!");
    }
  }

  // Function to update status
  function updateStatus(message) {
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  // Function to return to home page
  function returnToHome() {
    // Clear results and hide results area
    worksResultsDiv.innerHTML = "";
    worksResultsDiv.style.display = "none";
    imagesResultsDiv.innerHTML = "";
    imagesResultsDiv.style.display = "none";
    
    // Reset navigation styling
    document.querySelectorAll('.navOption').forEach(nav => nav.classList.remove('selectedNavOption'));
    navWorks.classList.add('selectedNavOption');
    
    // Reset search button
    searchButton.textContent = "Search Works";
    searchButton.onclick = function() { 
      if (!searchInput.value.trim()) return;
      searchWorks(); 
    };
    
    // Clear search input
    searchInput.value = "";
    
    // Hide suggestions safely
    if (suggestionsList && suggestionsList.style) {
      suggestionsList.style.display = "none";
    }
    
    // Update status
    updateStatus("Ready to search works!");
  }

  // Function to search works (new primary search)
  async function searchWorks() {
    // Show loading state
    updateStatus("Searching...");
    worksResultsDiv.innerHTML = "";
    imagesResultsDiv.style.display = "none";

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
          worksResultsDiv.appendChild(workDiv);
        });

        // Show results area
        worksResultsDiv.style.display = "block";
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
    imagesResultsDiv.innerHTML = "";
    worksResultsDiv.style.display = "none";

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
          imagesResultsDiv.appendChild(resultDiv);
        });

        // Show results area
        imagesResultsDiv.style.display = "flex";
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

  // Function to reset layout to homepage
  function resetLayoutToHomepage() {
    // Reset layout to homepage
    const homeScreen = document.getElementById("homeScreen");
    const searchItemsWrapper = document.getElementById("searchItemsWrapper");
    const imageSearchScreen = document.getElementById("imageSearchScreen");
    const title = document.getElementById("title");
    const searchContainer = document.getElementById("homeScreenSearchContainer");
    const navBar = document.getElementById("homeScreenNav");
    const luckyBtn = document.getElementById("luckyBtn");
    
    // Reset home screen wrapper
    homeScreen.style.padding = "0";
    homeScreen.style.display = "flex";
    homeScreen.style.height = "100vh";
    homeScreen.style.justifyContent = "center";
    homeScreen.style.alignItems = "center";

    // Reset search items wrapper
    searchItemsWrapper.style.flexDirection = "column";
    searchItemsWrapper.style.marginTop = "0";
    searchItemsWrapper.style.justifyContent = "center";
    searchItemsWrapper.style.alignItems = "center";

    // Reset search container
    searchContainer.style.flexDirection = "column";
    searchContainer.style.alignItems = "center";
    searchContainer.style.marginTop = "0";
    searchContainer.style.width = "500px";
    searchContainer.style.maxWidth = "90%";

    // Reset title/logo
    title.style.justifyContent = "center";
    title.style.marginBottom = "0";
    title.style.marginTop = "0";
    
    // Reset logo image
    if (logoImg) {
      logoImg.style.width = "70%";
      logoImg.style.margin = "0";
      logoImg.style.padding = "5%";
      logoImg.style.paddingTop = "0";
      logoImg.style.marginTop = "-10%";
    }
    
    // Reset navigation bar
    navBar.style.position = "absolute";
    navBar.style.top = "0";
    navBar.style.left = "0";
    navBar.style.width = "100%";
    navBar.style.padding = "5px";
    navBar.style.borderBottom = "1px solid black";
    navBar.style.backgroundColor = "transparent";
    navBar.style.textAlign = "left";
    
    // Show the "I'm Feeling Lucky" button
    luckyBtn.style.display = "block";
    
    // Hide search results area
    imageSearchScreen.style.display = "none";
    
    // Show footer info
    const footerInfo = document.getElementById("homeScreenInfo");
    if (footerInfo) {
      footerInfo.style.display = "block";
    }
  }

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

    // Create content container for text
    const contentDiv = document.createElement("div");
    contentDiv.className = "work-result-content";

    // Title link (Google blue)
    const titleLink = document.createElement("a");
    titleLink.href = work.url || "#";
    titleLink.className = "work-title";
    titleLink.textContent = work.title || "Untitled Work";

    // Debug: Log the URL being used
    console.log(`Creating link for ${work.title} with URL: ${work.url}`);

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

    contentDiv.appendChild(titleLink);
    contentDiv.appendChild(urlDiv);
    contentDiv.appendChild(descDiv);
    contentDiv.appendChild(metaDiv);

    workDiv.appendChild(contentDiv);

    // Add thumbnail image if available
    if (work.thumbnailImage) {
      const thumbnail = document.createElement("img");
      thumbnail.src = work.thumbnailImage;
      thumbnail.className = "work-thumbnail";
      thumbnail.alt = work.title || "Work thumbnail";
      workDiv.appendChild(thumbnail);
    }

    return workDiv;
  }

  function workSearchFormat() {
    // Get references to elements
    const homeScreen = document.getElementById("homeScreen");
    const searchItemsWrapper = document.getElementById("searchItemsWrapper");
    const worksResultsScreen = document.getElementById("worksResultsScreen");
    const imageSearchScreen = document.getElementById("imageSearchScreen");
    const title = document.getElementById("title");
    const searchContainer = document.getElementById("homeScreenSearchContainer");
    const navBar = document.getElementById("homeScreenNav");
    const btnContainer = document.getElementById("btnContainer");
    const luckyBtn = document.getElementById("luckyBtn");
    const searchBtn = document.getElementById("searchBtn");

    // Adjust home screen wrapper - center everything
    homeScreen.style.padding = "0";
    homeScreen.style.display = "flex";
    homeScreen.style.height = "auto";
    homeScreen.style.justifyContent = "center";

    searchItemsWrapper.style.flexDirection = "row";
    searchItemsWrapper.style.marginTop = "80px";
    searchItemsWrapper.style.justifyContent = "center";
    searchItemsWrapper.style.alignItems = "center";

    searchContainer.style.flexDirection = "row";
    searchContainer.style.alignItems = "center";
    searchContainer.style.marginTop = "0";
    searchContainer.style.marginLeft = "20px";
    searchContainer.style.width = "500px";
    searchContainer.style.maxWidth = "90%";

    searchInput.style.width = "500px";
    searchInput.style.maxWidth = "100%";
    searchInput.style.margin = "0";
    searchBtn.style.margin = "0 0 0 5px";
    searchBtn.style.padding = "7px 12px";

    // Adjust title/logo - center it
    title.style.justifyContent = "center";
    title.style.marginBottom = "0";
    title.style.marginTop = "0";

    // Adjust logo image
    const logoImg = title.querySelector("img");
    if (logoImg) {
      logoImg.style.width = "300px";
      logoImg.style.margin = "0";
    }

    // Move navigation bar to top-left
    navBar.style.position = "absolute";
    navBar.style.top = "0";
    navBar.style.left = "0";
    navBar.style.width = "100%";
    navBar.style.padding = "5px";
    navBar.style.borderBottom = "1px solid black";
    navBar.style.backgroundColor = "transparent";
    navBar.style.textAlign = "left";

    // Adjust search button text
    searchBtn.textContent = "Search Works";

    // Hide the "I'm Feeling Lucky" button
    luckyBtn.style.display = "none";

    // Hide image search results
    imageSearchScreen.style.display = "none";

    // Show work search results area - centered
    worksResultsScreen.style.marginTop = "250px";
    worksResultsScreen.style.display = "flex";
    worksResultsScreen.style.flexDirection = "column";
    worksResultsScreen.style.alignItems = "center";
    worksResultsScreen.style.justifyContent = "flex-start";
    worksResultsScreen.style.padding = "0 20px";
    worksResultsScreen.style.maxWidth = "800px";
    worksResultsScreen.style.width = "100%";
    worksResultsScreen.style.left = "50%";
    worksResultsScreen.style.transform = "translateX(-50%)";

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
    const worksResultsScreen = document.getElementById("worksResultsScreen");
    const imageSearchScreen = document.getElementById("imageSearchScreen");
    const title = document.getElementById("title");
    const searchContainer = document.getElementById("homeScreenSearchContainer");
    const navBar = document.getElementById("homeScreenNav");
    const btnContainer = document.getElementById("btnContainer");
    const luckyBtn = document.getElementById("luckyBtn");
    const searchBtn = document.getElementById("searchBtn");

    // Adjust home screen wrapper - center everything
    homeScreen.style.padding = "0";
    homeScreen.style.display = "flex";
    homeScreen.style.height = "auto";
    homeScreen.style.justifyContent = "center";

    searchItemsWrapper.style.flexDirection = "row";
    searchItemsWrapper.style.marginTop = "80px";
    searchItemsWrapper.style.justifyContent = "center";
    searchItemsWrapper.style.alignItems = "center";

    searchContainer.style.flexDirection = "row";
    searchContainer.style.alignItems = "center";
    searchContainer.style.marginTop = "0";
    searchContainer.style.marginLeft = "20px";
    searchContainer.style.width = "500px";
    searchContainer.style.maxWidth = "90%";

    searchInput.style.width = "500px";
    searchInput.style.maxWidth = "100%";
    searchInput.style.margin = "0";
    searchBtn.style.margin = "0 0 0 5px";
    searchBtn.style.padding = "7px 12px";

    // Adjust title/logo - center it
    title.style.justifyContent = "center";
    title.style.marginBottom = "0";
    title.style.marginTop = "0";

    // Adjust logo image
    const logoImg = title.querySelector("img");
    if (logoImg) {
      logoImg.style.width = "300px";
      logoImg.style.margin = "0";
    }

    // Move navigation bar to top-left
    navBar.style.position = "absolute";
    navBar.style.top = "0";
    navBar.style.left = "0";
    navBar.style.width = "100%";
    navBar.style.padding = "5px";
    navBar.style.borderBottom = "1px solid black";
    navBar.style.backgroundColor = "transparent";
    navBar.style.textAlign = "left";

    // Adjust search container
    searchContainer.style.width = "auto";
    searchContainer.style.alignItems = "center";

    // Adjust search button text
    searchBtn.textContent = "Image Search";

    // Hide the "I'm Feeling Lucky" button
    luckyBtn.style.display = "none";

    // Hide works search results
    worksResultsScreen.style.display = "none";

    // Show image search results area - centered
    imageSearchScreen.style.marginTop = "250px";
    imageSearchScreen.style.display = "flex";
    imageSearchScreen.style.flexWrap = "wrap";
    imageSearchScreen.style.justifyContent = "center";
    imageSearchScreen.style.alignItems = "flex-start";
    imageSearchScreen.style.padding = "0 20px";
    imageSearchScreen.style.maxWidth = "1200px";
    imageSearchScreen.style.width = "100%";
    imageSearchScreen.style.left = "50%";
    imageSearchScreen.style.transform = "translateX(-50%)";

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
  // Only trigger search if input is not empty or only spaces
  if (searchInput.value.trim()) {
    // Get the current search function from the button onclick
    const searchButton = document.querySelector("#searchBtn");
    if (searchButton && searchButton.onclick) {
      searchButton.onclick();
    }
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