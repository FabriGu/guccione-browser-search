// Client-side JavaScript for image search
document.addEventListener('DOMContentLoaded', function() {
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
      resultsDiv.innerHTML = '';
      
      // Hide the title
      if (title) {
        title.style.display = "none";
      }
  
      // Get query text
      const query = searchInput.value.trim();
      if (!query) {
        updateStatus("Please enter a search term");
        return;
      }
  
      try {
        // Send search request to the server
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });
  
        if (!response.ok) {
          throw new Error('Search request failed');
        }
  
        const data = await response.json();
        
        // Display results
        if (data.results && data.results.length > 0) {
          data.results.forEach(result => {
            // Create result container
            const resultDiv = document.createElement('div');
            resultDiv.className = 'result-item';
            resultDiv.style.display = 'inline-block';
            resultDiv.style.margin = '10px';
            
            // Create image element
            const img = document.createElement('img');
            img.src = result.url;
            img.alt = `Result ${result.id}`;
            img.style.width = '200px';
            img.style.height = 'auto';
            
            // Create score element
            const scoreP = document.createElement('p');
            scoreP.textContent = result.similarity.toFixed(2);
            
            // Add elements to the DOM
            resultDiv.appendChild(img);
            resultDiv.appendChild(scoreP);
            resultsDiv.appendChild(resultDiv);
          });
          
          // Show results area
          resultsDiv.style.display = 'block';
          updateStatus("Results found!");
        } else {
          updateStatus("No results found");
        }
      } catch (error) {
        console.error('Error during search:', error);
        updateStatus("Error searching for images");
      }
    }
  
    // Initialize
    updateStatus("Ready to search!");
  });