  /// ----------------------------------------------------------- SEARCH COMPLETION VARIABLE DECLARATION
  let suggestionsList;
  let resultsSuggestionsList;
let suggestionTimeout;
const SUGGESTION_DELAY = 300; // milliseconds to wait before fetching suggestions
  /// ----------------------------------------------------------- SEARCH COMPLETION VARIABLE DECLARATION

// Utility function to normalize image paths
function normalizeImagePath(path) {
  if (!path) return '';

  // Remove leading slash if present
  let normalized = path.replace(/^\/+/, '');

  // Remove 'public/assets/' prefix if present (common mistake)
  normalized = normalized.replace(/^public\/assets\//, '');

  // Remove 'assets/' prefix if present
  normalized = normalized.replace(/^assets\//, '');

  // Ensure path starts with /assets/
  return `/assets/${normalized}`;
}

// Client-side JavaScript for image search
document.addEventListener("DOMContentLoaded", function () {

  // Get references to DOM elements
  const searchInput = document.querySelector("#searchInput");
  const resultsSearchInput = document.querySelector("#resultsSearchInput");
  const searchButton = document.querySelector("#searchBtn");
  const resultsSearchButton = document.querySelector("#resultsSearchBtn");
  const worksResultsDiv = document.querySelector("#worksResultsScreen");
  const imagesResultsDiv = document.querySelector("#imageSearchScreen");
  const title = document.querySelector("#title");
  const statusElement = document.querySelector("#status");
  const resultsSearchBar = document.querySelector("#resultsSearchBar");
  const homeScreen = document.querySelector("#homeScreen");
  const homeScreenNav = document.querySelector("#homeScreenNav");
  const searchItemsWrapper = document.querySelector("#searchItemsWrapper");

   /// ----------------------------------------------------------- SEARCH COMPLETION logic
// Create and add suggestions container for homepage
suggestionsList = document.createElement("div");
suggestionsList.id = "suggestionsList";
suggestionsList.className = "suggestions-list";
searchInput.parentNode.insertBefore(suggestionsList, searchInput.nextSibling);

// Create and add suggestions container for results view
resultsSuggestionsList = document.getElementById("resultsSuggestionsList");

// Add event listener for input changes to show suggestions
searchInput.addEventListener("input", handleInputChange);
resultsSearchInput.addEventListener("input", handleResultsInputChange);

// Add event listener to hide suggestions when clicking outside
document.addEventListener("click", function(event) {
  if (event.target !== searchInput && event.target !== suggestionsList) {
    hideSuggestions();
  }
  if (event.target !== resultsSearchInput && event.target !== resultsSuggestionsList) {
    hideResultsSuggestions();
  }
});

// Add keyboard navigation for suggestions
searchInput.addEventListener("keydown", handleKeyNavigation);
resultsSearchInput.addEventListener("keydown", handleResultsKeyNavigation);

// Sync search inputs
searchInput.addEventListener("input", function() {
  resultsSearchInput.value = searchInput.value;
});

resultsSearchInput.addEventListener("input", function() {
  searchInput.value = resultsSearchInput.value;
});

// Results search button click
resultsSearchButton.addEventListener("click", function() {
  if (resultsSearchInput.value.trim()) {
    // Determine which search mode we're in based on selected nav
    const selectedNav = document.querySelector(".selected-results-nav");
    if (selectedNav && selectedNav.id === "resultsNavImages") {
      searchImages();
    } else {
      searchWorks();
    }
  }
});

// Results search input enter key
resultsSearchInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter" && resultsSearchInput.value.trim()) {
    event.preventDefault();
    resultsSearchButton.click();
  }
});

// Results logo click
document.getElementById("resultsLogo").addEventListener("click", function() {
  returnToHome();
  resetLayoutToHomepage();
});

// Results navigation
document.getElementById("resultsNavWorks").addEventListener("click", function(e) {
  e.preventDefault();
  switchResultsNav("works");
  switchToWorksMode();
});

document.getElementById("resultsNavImages").addEventListener("click", function(e) {
  e.preventDefault();
  switchResultsNav("images");
  switchToImagesMode();
});

document.getElementById("resultsNavAbout").addEventListener("click", function(e) {
  e.preventDefault();
  window.open("about.html", "_blank");
});


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
    searchButton.textContent = "Search Work";
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
    searchButton.textContent = "Search Work";
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

    // Check for recruiter view special query
    const RECRUITER_VIEW_QUERY = "All of Fabrizio Guccione's Work";
    if (query.toLowerCase() === RECRUITER_VIEW_QUERY.toLowerCase()) {
      loadRecruiterView();
      return; // Don't continue with normal search
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
        worksResultsDiv.style.display = "flex";
        updateStatus(`Found ${data.results.length} works`);
      } else {
        // No results - show helpful message
        const noResultsDiv = document.createElement("div");
        noResultsDiv.className = "no-results-message";
        noResultsDiv.style.padding = "40px 20px";
        noResultsDiv.style.textAlign = "center";
        noResultsDiv.style.color = "#70757a";
        noResultsDiv.innerHTML = `
          <p style="font-size: 16px; margin-bottom: 16px;">No results found for "<strong>${query}</strong>"</p>
          <p style="font-size: 14px; line-height: 1.6;">
            Our search uses semantic matching to find works based on meaning, not just keywords.
            Try using different words that describe what you're looking for, or try a broader search term.
          </p>
        `;
        worksResultsDiv.appendChild(noResultsDiv);
        worksResultsDiv.style.display = "block";
        updateStatus("No works found");
      }

      // Push state to browser history for back button support
      const state = { query, mode: 'works', timestamp: Date.now() };
      const url = `/?q=${encodeURIComponent(query)}&mode=works`;
      history.pushState(state, `Search: ${query}`, url);
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

      // Display results in Google Images row-based layout
      if (data.results && data.results.length > 0) {
        lastImageResults = data.results; // Store for resize handling
        layoutImagesInRows(data.results, imagesResultsDiv);
        updateStatus("Results found!");
      } else {
        updateStatus("No results found");
      }

      // Push state to browser history for back button support
      const state = { query, mode: 'images', timestamp: Date.now() };
      const url = `/?q=${encodeURIComponent(query)}&mode=images`;
      history.pushState(state, `Search: ${query}`, url);
    } catch (error) {
      console.error("Error during search:", error);
      updateStatus("Error searching for images");
    }
  }

  // Function to load recruiter view (all works chronologically, no AI)
  async function loadRecruiterView() {
    // Show loading state
    updateStatus("Loading portfolio...");
    worksResultsDiv.innerHTML = "";
    imagesResultsDiv.style.display = "none";

    workSearchFormat();

    // Set search input to indicate what we're showing
    const displayText = "All of Fabrizio Guccione's Work";
    searchInput.value = displayText;
    resultsSearchInput.value = displayText;

    try {
      // Fetch all works chronologically
      const response = await fetch("/api/works/all?sortBy=year&order=desc");

      if (!response.ok) {
        throw new Error("Failed to fetch works");
      }

      const data = await response.json();

      // Display results
      if (data.works && data.works.length > 0) {
        data.works.forEach((work) => {
          const workDiv = createWorkResultElement(work);
          worksResultsDiv.appendChild(workDiv);
        });

        // Show results area
        worksResultsDiv.style.display = "flex";
        updateStatus(`Showing ${data.works.length} works (newest first)`);
      } else {
        const noResultsDiv = document.createElement("div");
        noResultsDiv.className = "no-results-message";
        noResultsDiv.style.padding = "40px 20px";
        noResultsDiv.style.textAlign = "center";
        noResultsDiv.style.color = "#70757a";
        noResultsDiv.innerHTML = `<p style="font-size: 16px;">No works available</p>`;
        worksResultsDiv.appendChild(noResultsDiv);
        worksResultsDiv.style.display = "block";
        updateStatus("No works found");
      }

      // Push state to browser history for back button support
      const state = { mode: 'recruiter', timestamp: Date.now() };
      const url = `/?view=recruiter`;
      history.pushState(state, `Portfolio - All Works`, url);
    } catch (error) {
      console.error("Error loading recruiter view:", error);
      updateStatus("Error loading portfolio");
    }
  }

  // Initialize
  updateStatus("Ready to search!");

  // Handle browser back button
  window.addEventListener('popstate', function(event) {
    if (event.state && event.state.mode === 'recruiter') {
      // Restore recruiter view
      loadRecruiterView();
    } else if (event.state && event.state.query) {
      // Restore search from history state
      searchInput.value = event.state.query;
      resultsSearchInput.value = event.state.query;

      if (event.state.mode === 'works') {
        searchWorks();
      } else if (event.state.mode === 'images') {
        searchImages();
      }
    } else {
      // No state, return to homepage
      returnToHome();
      resetLayoutToHomepage();
    }
  });

  // Check URL parameters on page load (for shareable URLs)
  const urlParams = new URLSearchParams(window.location.search);
  const queryParam = urlParams.get('q');
  const modeParam = urlParams.get('mode');
  const viewParam = urlParams.get('view');

  // Check for recruiter mode first
  if (viewParam === 'recruiter' || modeParam === 'portfolio') {
    loadRecruiterView();
  } else if (queryParam) {
    searchInput.value = queryParam;
    resultsSearchInput.value = queryParam;

    // Trigger search based on mode
    if (modeParam === 'works' || !modeParam) {
      searchWorks();
    } else if (modeParam === 'images') {
      searchImages();
    }
  }

  // Handle window resize for image grid re-layout
  let resizeTimeout;
  let lastImageResults = null;

  window.addEventListener('resize', function() {
    // Debounce resize events
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      // Re-layout image grid if we're on the image search page
      const imagesDiv = document.getElementById("imageSearchScreen");
      if (imagesDiv && imagesDiv.style.display === "block" && lastImageResults) {
        layoutImagesInRows(lastImageResults, imagesDiv);
      }
    }, 250); // Wait 250ms after resize ends
  });

  // Function to reset layout to homepage
  function resetLayoutToHomepage() {
    // Show homeScreen wrapper (standard approach - only one screen visible at a time)
    if (homeScreen) {
      homeScreen.style.display = "flex";
    }

    // Hide results search bar
    resultsSearchBar.style.display = "none";

    // Hide results screens
    worksResultsDiv.style.display = "none";
    imagesResultsDiv.style.display = "none";
  }

  // Switch results navigation
  function switchResultsNav(mode) {
    const navWorks = document.getElementById("resultsNavWorks");
    const navImages = document.getElementById("resultsNavImages");

    // Remove selected class from all
    navWorks.classList.remove("selected-results-nav");
    navImages.classList.remove("selected-results-nav");

    // Add to selected
    if (mode === "works") {
      navWorks.classList.add("selected-results-nav");
    } else if (mode === "images") {
      navImages.classList.add("selected-results-nav");
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

  // Extract domain from URL or use work title
  function extractDomain(imgData) {
    // Use workTitle if available
    if (imgData.workTitle) {
      return imgData.workTitle;
    }

    // Fallback to URL parsing
    if (!imgData.url) return "unknown";

    try {
      // For local files without workTitle, return placeholder
      if (imgData.url.startsWith("projects/") || imgData.url.startsWith("images/")) {
        return "Portfolio Work";
      }

      const urlObj = new URL(imgData.url);
      return urlObj.hostname;
    } catch (e) {
      return "unknown";
    }
  }

  // Create URL-friendly slug from title
  function createSlugFromTitle(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/-+/g, '-');      // Replace multiple hyphens with single hyphen
  }

  // Layout images in rows like Google Images
  function layoutImagesInRows(results, container) {
    const TARGET_ROW_HEIGHT = 220; // Target height for each row in pixels
    const GAP = 4; // Gap between images
    const containerWidth = container.offsetWidth || window.innerWidth - 16;

    // Store image data with dimensions
    let imageData = [];
    let loadedCount = 0;

    // First, load all images to get their dimensions
    results.forEach((result, index) => {
      const img = new Image();
      img.src = normalizeImagePath(result.url);

      img.onload = function() {
        imageData[index] = {
          result: result,
          width: this.naturalWidth,
          height: this.naturalHeight,
          aspectRatio: this.naturalWidth / this.naturalHeight
        };

        loadedCount++;

        // Once all images are loaded, arrange them in rows
        if (loadedCount === results.length) {
          arrangeIntoRows(imageData, container, containerWidth, TARGET_ROW_HEIGHT, GAP);
        }
      };

      img.onerror = function() {
        // Handle error by using placeholder dimensions
        imageData[index] = {
          result: result,
          width: 300,
          height: 200,
          aspectRatio: 1.5
        };

        loadedCount++;

        if (loadedCount === results.length) {
          arrangeIntoRows(imageData, container, containerWidth, TARGET_ROW_HEIGHT, GAP);
        }
      };
    });
  }

  function arrangeIntoRows(imageData, container, containerWidth, targetHeight, gap) {
    container.innerHTML = ""; // Clear existing content

    let currentRow = [];
    let currentRowWidth = 0;

    imageData.forEach((imgData, index) => {
      // Calculate scaled width for this image at target height
      const scaledWidth = imgData.aspectRatio * targetHeight;

      // Add to current row
      currentRow.push(imgData);
      currentRowWidth += scaledWidth + (currentRow.length > 1 ? gap : 0);

      // Check if row is full or this is the last image
      const isLastImage = index === imageData.length - 1;
      const isRowFull = currentRowWidth >= containerWidth - 50; // Leave some margin

      if (isRowFull || isLastImage) {
        // Create and append the row
        createImageRow(currentRow, container, containerWidth, targetHeight, gap);

        // Reset for next row
        currentRow = [];
        currentRowWidth = 0;
      }
    });
  }

  function createImageRow(rowImages, container, containerWidth, targetHeight, gap) {
    // Calculate total width if all images were at target height
    let totalWidth = 0;
    rowImages.forEach((imgData, i) => {
      totalWidth += imgData.aspectRatio * targetHeight;
      if (i < rowImages.length - 1) totalWidth += gap;
    });

    // Calculate scaling factor to fit row to container width
    const scalingFactor = Math.min(1, (containerWidth - gap * 2) / totalWidth);
    const actualHeight = targetHeight * scalingFactor;

    // Create row div
    const rowDiv = document.createElement("div");
    rowDiv.className = "image-row";
    rowDiv.style.height = `${actualHeight}px`;

    // Create each image in the row
    rowImages.forEach((imgData) => {
      const actualWidth = imgData.aspectRatio * actualHeight;

      // Create result item
      const resultDiv = document.createElement("div");
      resultDiv.className = "result-item";
      resultDiv.style.width = `${actualWidth}px`;

      // Create image container
      const imageContainer = document.createElement("div");
      imageContainer.className = "image-container";
      imageContainer.style.height = `${actualHeight}px`;

      // Create image element
      const img = document.createElement("img");
      img.src = normalizeImagePath(imgData.result.url);
      img.alt = imgData.result.caption || "";

      // Make image clickable if workId available
      if (imgData.result.workId) {
        const link = document.createElement('a');
        link.href = `project.html?id=${encodeURIComponent(imgData.result.workId)}`;
        link.appendChild(img);
        imageContainer.appendChild(link);
      } else {
        imageContainer.appendChild(img);
      }

      // Create info section (below image)
      const infoDiv = document.createElement("div");
      infoDiv.className = "imageInfo";

      // Source
      const sourceDiv = document.createElement("div");
      sourceDiv.className = "imageSource";
      sourceDiv.textContent = extractDomain(imgData.result);

      // Caption
      const captionDiv = document.createElement("div");
      captionDiv.className = "imageCaption";
      captionDiv.textContent = truncateText(imgData.result.caption, 60);

      // Metadata
      const metaDiv = document.createElement("div");
      metaDiv.className = "imageMeta";
      const fileSize = estimateFileSize(imgData.width, imgData.height);
      metaDiv.textContent = `${imgData.width} × ${imgData.height} • ${fileSize}`;

      // Relevance score
      if (imgData.result.similarity && imgData.result.similarity > 0) {
        const relevanceDiv = document.createElement("div");
        relevanceDiv.className = "imageRelevance";
        relevanceDiv.style.fontSize = "12px";
        relevanceDiv.style.color = "#70757a";
        relevanceDiv.style.marginTop = "4px";
        relevanceDiv.textContent = `Relevance: ${(imgData.result.similarity * 100).toFixed(1)}%`;
        infoDiv.appendChild(relevanceDiv);
      }

      // Assemble info
      infoDiv.appendChild(sourceDiv);
      infoDiv.appendChild(captionDiv);
      infoDiv.appendChild(metaDiv);

      // Assemble result item
      resultDiv.appendChild(imageContainer);
      resultDiv.appendChild(infoDiv);
      rowDiv.appendChild(resultDiv);
    });

    container.appendChild(rowDiv);
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

    // Use project ID if available, otherwise create slug from title
    const projectId = work.id || work.slug || createSlugFromTitle(work.title || "untitled");
    titleLink.href = `/project.html?id=${encodeURIComponent(projectId)}`;
    titleLink.className = "work-title";
    titleLink.textContent = work.title || "Untitled Work";

    // Debug: Log the URL being used
    console.log(`Creating link for ${work.title} with URL: /project.html?id=${encodeURIComponent(projectId)}`);

    // URL display (Google green)
    const urlDiv = document.createElement("div");
    urlDiv.className = "work-url";
    urlDiv.textContent = `guccione.com/work/${projectId}`;

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
      thumbnail.src = normalizeImagePath(work.thumbnailImage);
      thumbnail.className = "work-thumbnail";
      thumbnail.alt = work.title || "Work thumbnail";
      workDiv.appendChild(thumbnail);
    }

    return workDiv;
  }

  function workSearchFormat() {
    // Hide homeScreen wrapper (standard approach - only one screen visible at a time)
    if (homeScreen) {
      homeScreen.style.display = "none";
    }

    // Show results search bar
    resultsSearchBar.style.display = "block";

    // Update results nav
    switchResultsNav("works");

    // Hide image search results screen
    imagesResultsDiv.style.display = "none";

    // Show work search results screen (CSS handles centering)
    worksResultsDiv.style.display = "flex";
  }

  function imageSearchFormat() {
    // Hide homeScreen wrapper (standard approach - only one screen visible at a time)
    if (homeScreen) {
      homeScreen.style.display = "none";
    }

    // Show results search bar
    resultsSearchBar.style.display = "block";

    // Update results nav
    switchResultsNav("images");

    // Hide works search results screen
    worksResultsDiv.style.display = "none";

    // Show image search results screen
    imagesResultsDiv.style.display = "block";
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

    // Create text nodes to avoid spacing issues with innerHTML
    const text = suggestion.query;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerQuery);

    if (matchIndex !== -1) {
      // Split into parts: before match, match, after match
      const before = text.substring(0, matchIndex);
      const match = text.substring(matchIndex, matchIndex + query.length);
      const after = text.substring(matchIndex + query.length);

      // Add non-matched part (bold)
      if (before) {
        const beforeSpan = document.createElement("span");
        beforeSpan.className = "suggestion-bold";
        beforeSpan.textContent = before;
        item.appendChild(beforeSpan);
      }

      // Add matched part (regular)
      const matchSpan = document.createElement("span");
      matchSpan.className = "highlight";
      matchSpan.textContent = match;
      item.appendChild(matchSpan);

      // Add remaining part (bold)
      if (after) {
        const afterSpan = document.createElement("span");
        afterSpan.className = "suggestion-bold";
        afterSpan.textContent = after;
        item.appendChild(afterSpan);
      }
    } else {
      // No match, just show text as bold
      item.textContent = text;
    }
    
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
  const items = document.querySelectorAll('#suggestionsList .suggestion-item');
  if (!items.length || suggestionsList.style.display === 'none') return;

  // Find the currently selected item (if any)
  const selected = document.querySelector('#suggestionsList .suggestion-item.selected');
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

// ============================================
// RESULTS VIEW AUTOCOMPLETE FUNCTIONS
// ============================================

// Handle input change for results search bar
function handleResultsInputChange() {
  const query = resultsSearchInput.value.trim();

  // Clear previous timeout
  if (suggestionTimeout) {
    clearTimeout(suggestionTimeout);
  }

  // Hide suggestions if query is empty
  if (!query) {
    hideResultsSuggestions();
    return;
  }

  // Set timeout to fetch suggestions
  suggestionTimeout = setTimeout(() => {
    fetchResultsSuggestions(query);
  }, SUGGESTION_DELAY);
}

// Fetch suggestions for results search bar
async function fetchResultsSuggestions(query) {
  try {
    const response = await fetch(`/api/suggestions?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error("Failed to fetch suggestions");
    }

    const data = await response.json();
    displayResultsSuggestions(data.suggestions, query);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    hideResultsSuggestions();
  }
}

// Display suggestions for results search bar
function displayResultsSuggestions(suggestions, query) {
  // Clear previous suggestions
  resultsSuggestionsList.innerHTML = "";

  // Hide if no suggestions
  if (!suggestions || suggestions.length === 0) {
    hideResultsSuggestions();
    return;
  }

  // Create suggestion items
  suggestions.forEach((suggestion, index) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.dataset.index = index;

    // Create text nodes to avoid spacing issues
    const text = suggestion.query;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerQuery);

    if (matchIndex !== -1) {
      // Split into parts: before match, match, after match
      const before = text.substring(0, matchIndex);
      const match = text.substring(matchIndex, matchIndex + query.length);
      const after = text.substring(matchIndex + query.length);

      // Add non-matched part (bold)
      if (before) {
        const beforeSpan = document.createElement("span");
        beforeSpan.className = "suggestion-bold";
        beforeSpan.textContent = before;
        item.appendChild(beforeSpan);
      }

      // Add matched part (regular)
      const matchSpan = document.createElement("span");
      matchSpan.className = "highlight";
      matchSpan.textContent = match;
      item.appendChild(matchSpan);

      // Add remaining part (bold)
      if (after) {
        const afterSpan = document.createElement("span");
        afterSpan.className = "suggestion-bold";
        afterSpan.textContent = after;
        item.appendChild(afterSpan);
      }
    } else {
      // No match, just show text as bold
      item.textContent = text;
    }

    // Add click event to select this suggestion
    item.addEventListener("click", () => {
      selectResultsSuggestion(suggestion.query);
    });

    resultsSuggestionsList.appendChild(item);
  });

  // Show the suggestions list
  resultsSuggestionsList.style.display = "block";
}

// Hide suggestions for results search bar
function hideResultsSuggestions() {
  resultsSuggestionsList.style.display = "none";
}

// Select a suggestion for results search bar
function selectResultsSuggestion(text) {
  resultsSearchInput.value = text;
  searchInput.value = text; // Sync with homepage input
  hideResultsSuggestions();
  // Trigger search
  resultsSearchButton.click();
}

// Handle keyboard navigation for results search bar
function handleResultsKeyNavigation(event) {
  const items = document.querySelectorAll('#resultsSuggestionsList .suggestion-item');
  if (!items.length || resultsSuggestionsList.style.display === 'none') return;

  // Find the currently selected item (if any)
  const selected = document.querySelector('#resultsSuggestionsList .suggestion-item.selected');
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
        selectResultsSuggestion(selected.textContent);
      }
      break;

    case 'Escape':
      // Hide suggestions
      hideResultsSuggestions();
      break;
  }
}