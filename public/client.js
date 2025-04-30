// Client-side JavaScript for image search
document.addEventListener("DOMContentLoaded", function () {
  // Get references to DOM elements
  const searchInput = document.querySelector("#searchInput");
  const searchButton = document.querySelector("#searchBtn");
  const resultsDiv = document.querySelector("#imageSearchScreen");
  const title = document.querySelector("#title");
  const statusElement = document.querySelector("#status");

  // Add event listener for search button
  searchButton.addEventListener("click", searchImages);

  // Function to update status
  function updateStatus(message) {
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  // Function to search images
  async function searchImages() {

    // Show loading state
    updateStatus("Searching...");
    resultsDiv.innerHTML = "";

    // // Hide the title
    // if (title) {
    //   title.style.display = "none";
    // }

    imageSearchFormat();

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
          // resultDiv.style.display = 'flex';
          resultDiv.style.margin = "20px";

          // Create image element
          const img = document.createElement("img");
          img.src = result.url;
          // img.alt = `Result ${result.id}`;
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
          // ts
          infoDiv.appendChild(captionDiv);
          infoDiv.appendChild(metaDiv);
          infoDiv.appendChild(sourceDiv);

          resultDiv.appendChild(img);
          resultDiv.appendChild(infoDiv);
          resultsDiv.appendChild(resultDiv);
          // Add elements to the DOM
          // resultDiv.appendChild(img);
          // resultDiv.appendChild(scoreP);
          // resultsDiv.appendChild(resultDiv);
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
    // homeScreen.style.alignItems = "flex-start";
    // homeScreen.style.alignItems = "flex-start";
    homeScreen.style.padding = "10px 0 0 10px";
    homeScreen.style.display = "flex"
    // homeScreen.style.flexDirection = "row"
    homeScreen.style.height = "10vh"
    // homeScreen.style.marginTop = "5vh"

    searchItemsWrapper.style.flexDirection = "row"
    searchItemsWrapper.style.marginTop = "10vh"

    searchContainer.style.flexDirection = "row"
    searchContainer.style.alignItems = "center"
    searchContainer.style.marginTop = "2vh"

    searchInput.style.margin = "0"
    searchBtn.style.margin = "0"
    searchBtn.style.marginLeft = "5px"
    
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
