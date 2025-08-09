// scripts/generate-work-pages.js - Generate themed work pages from JSON data
const fs = require('fs');
const path = require('path');

// Load works data
const worksPath = path.join(__dirname, '../data/works.json');
const worksData = JSON.parse(fs.readFileSync(worksPath, 'utf8'));

// HTML template for work pages
function generateWorkPageHTML(work) {
  const theme = work.theme || {};
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>${work.title} - Guccione</title>
    <link rel="stylesheet" type="text/css" href="../css/desktop.css" />
    <style>
        /* Dynamic theme styling */
        body {
            ${theme.backgroundGradient ? `background: ${theme.backgroundGradient};` : ''}
            ${theme.backgroundColor && !theme.backgroundGradient ? `background-color: ${theme.backgroundColor};` : ''}
            ${theme.backgroundImage ? `background-image: url('${theme.backgroundImage}');` : ''}
            ${theme.backgroundImage ? `background-size: cover; background-position: center;` : ''}
            color: ${theme.textColor || '#333'};
            min-height: 100vh;
        }
        
        .work-page {
            ${theme.backgroundColor ? `background: rgba(${hexToRgb(theme.backgroundColor)}, 0.9);` : 'background: rgba(255, 255, 255, 0.95);'}
            backdrop-filter: blur(10px);
            margin: 20px;
            border-radius: 10px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .work-page header nav a {
            color: ${theme.accentColor || '#1a0dab'};
        }
        
        .work-page header nav a:hover {
            color: ${theme.textColor || '#333'};
        }
        
        .work-content h1 {
            color: ${theme.accentColor || '#333'};
        }
        
        .work-meta {
            color: ${adjustBrightness(theme.textColor || '#666', -30)};
        }
        
        .work-text-content h2 {
            color: ${theme.accentColor || '#333'};
        }
        
        .work-tags .tag {
            background-color: ${theme.accentColor ? `${theme.accentColor}20` : '#f0f0f0'};
            color: ${theme.accentColor || '#666'};
            border: 1px solid ${theme.accentColor || '#ddd'};
        }
        
        .work-images img {
            border: 2px solid ${theme.accentColor || '#ddd'};
        }
    </style>
</head>
<body>
    <div class="work-page">
        <header>
            <nav>
                <a href="../index.html">← Back to Search</a>
                <a href="../index.html">Home</a>
            </nav>
        </header>
        
        <main class="work-content">
            <h1>${work.title}</h1>
            <div class="work-meta">
                <span class="year">${work.year}</span>
                <span class="medium">${Array.isArray(work.medium) ? work.medium.join(', ') : work.medium}</span>
                <span class="status">${capitalize(work.status)}</span>
            </div>
            
            <div class="work-description">
                <p>${work.description}</p>
            </div>
            
            ${work.images && work.images.length > 0 ? `
            <div class="work-images">
                ${work.images.map(image => `<img src="../${image}" alt="${work.title} - Image" />`).join('\n                ')}
            </div>
            ` : ''}
            
            <div class="work-text-content">
                <h2>About This Work</h2>
                ${formatTextContent(work.textContent)}
            </div>
            
            ${work.tags && work.tags.length > 0 ? `
            <div class="work-tags">
                ${work.tags.map(tag => `<span class="tag">${tag}</span>`).join('\n                ')}
            </div>
            ` : ''}
        </main>
    </div>
</body>
</html>`;
}

// Helper functions
function hexToRgb(hex) {
  if (!hex) return '255, 255, 255';
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '255, 255, 255';
}

function adjustBrightness(hex, percent) {
  if (!hex) return '#666';
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function formatTextContent(text) {
  if (!text) return '<p>No additional information available.</p>';
  
  // Split by paragraphs and wrap in <p> tags
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  return paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n                ');
}

// Generate all work pages
function generateAllWorkPages() {
  const workDir = path.join(__dirname, '../public/work');
  
  // Ensure work directory exists
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir, { recursive: true });
  }
  
  console.log('Generating themed work pages...');
  
  worksData.works.forEach(work => {
    const fileName = work.url.split('/').pop(); // Extract filename from URL
    const filePath = path.join(workDir, fileName);
    const html = generateWorkPageHTML(work);
    
    fs.writeFileSync(filePath, html);
    console.log(`Generated: ${fileName} with theme: ${work.theme ? 'Custom' : 'Default'}`);
  });
  
  console.log(`\nCompleted! Generated ${worksData.works.length} work pages with custom themes.`);
}

// Run if called directly
if (require.main === module) {
  generateAllWorkPages();
}

module.exports = { generateAllWorkPages, generateWorkPageHTML };
