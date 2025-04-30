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
    
    // Also add enter key support
    searchInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        searchImages();
      }
    });
  
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
            resultDiv.style.width = '200px';
            resultDiv.style.verticalAlign = 'top';
            
            // Create image element
            const img = document.createElement('img');
            img.src = result.url;
            img.alt = result.caption || `Result ${result.id}`;
            img.style.width = '200px';
            img.style.height = 'auto';
            img.style.maxHeight = '150px';
            img.style.objectFit = 'contain';
            
            // Create caption element (Google 2009 style)
            const captionP = document.createElement('p');
            captionP.textContent = result.caption || '';
            captionP.style.margin = '5px 0';
            captionP.style.fontSize = '0.9em';
            captionP.style.color = '#000';
            captionP.style.textAlign = 'left';
            
            // Create score element (small and light, like Google 2009)
            const scoreP = document.createElement('p');
            scoreP.textContent = `${result.similarity.toFixed(2)}`;
            scoreP.style.margin = '2px 0';
            scoreP.style.fontSize = '0.8em';
            scoreP.style.color = '#888';
            
            // Add elements to the DOM
            resultDiv.appendChild(img);
            resultDiv.appendChild(captionP);
            resultDiv.appendChild(scoreP);
            resultsDiv.appendChild(resultDiv);
          });
          
          // Show results area
          resultsDiv.style.display = 'flex';
          resultsDiv.style.flexWrap = 'wrap';
          resultsDiv.style.justifyContent = 'flex-start';
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