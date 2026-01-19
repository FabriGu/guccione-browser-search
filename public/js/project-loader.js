/**
 * Guccione Project Page Loader
 * Dynamically loads and renders project content from JSON data
 */

// Get project ID from URL query parameter
function getProjectId() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  return id ? decodeURIComponent(id) : null;
}

// Load project JSON data
async function loadProjectData(projectId) {
  try {
    // Use API endpoint instead of direct file access
    const response = await fetch(`/api/projects/${projectId}`);
    console.log(`Fetching project: ${projectId}`, response.status);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Project not found: ${projectId}`);
      } else if (response.status === 400) {
        throw new Error(`Invalid project data: ${projectId}`);
      } else {
        throw new Error(`Server error loading project: ${projectId}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error loading project:', error);
    showError(error.message || 'Project not found');
    return null;
  }
}

// Apply theme to page
function applyTheme(theme) {
  if (!theme) return;

  const root = document.documentElement;

  if (theme.backgroundColor) {
    root.style.setProperty('--bg-color', theme.backgroundColor);
  }
  if (theme.accentColor) {
    root.style.setProperty('--accent-color', theme.accentColor);
  }
  if (theme.textColor) {
    root.style.setProperty('--text-color', theme.textColor);
  }
  if (theme.secondaryTextColor) {
    root.style.setProperty('--text-secondary', theme.secondaryTextColor);
  }
  if (theme.fontFamily) {
    root.style.setProperty('--font-family', theme.fontFamily);

    // If using Google Fonts, inject link tag
    if (theme.fontFamily.includes('fonts.googleapis.com') ||
        (!theme.fontFamily.includes('-apple-system') && !theme.fontFamily.includes('sans-serif'))) {
      // Extract font name for Google Fonts
      const fontName = theme.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
      loadGoogleFont(fontName);
    }
  }
}

// Load Google Font
function loadGoogleFont(fontName) {
  // Convert font name to Google Fonts URL format
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@200;300;400;500;600;700&display=swap`;

  // Check if already loaded
  const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
  if (existingLink) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = fontUrl;
  document.head.appendChild(link);
}

// Normalize image path to handle different formats
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

/**
 * Detects if a file is a video based on extension
 * @param {string} src - File path
 * @returns {boolean} - True if video file
 */
function isVideoFile(src) {
  if (!src) return false;
  const videoExtensions = ['.mp4', '.mov', '.webm', '.MOV', '.MP4', '.WEBM'];
  return videoExtensions.some(ext => src.toLowerCase().endsWith(ext.toLowerCase()));
}

/**
 * Creates a video element with hover/tap play/pause interaction
 * @param {Object} mediaData - Video data from JSON
 * @param {string} mediaData.src - Video file path
 * @param {boolean} mediaData.loop - Whether to loop video
 * @param {boolean} mediaData.muted - Whether to mute audio
 * @param {string} mediaData.poster - Optional poster image
 * @returns {HTMLVideoElement} - Configured video element
 */
function createVideoElement(mediaData) {
  const video = document.createElement('video');
  video.src = normalizeImagePath(mediaData.src);
  video.loop = mediaData.loop !== undefined ? mediaData.loop : false;
  video.muted = mediaData.muted !== undefined ? mediaData.muted : false;
  video.playsInline = true;  // Prevent fullscreen on iOS
  video.preload = 'metadata';  // Load metadata only initially

  if (mediaData.poster) {
    video.poster = normalizeImagePath(mediaData.poster);
  }

  // Hover play/pause for desktop
  video.addEventListener('mouseenter', () => {
    video.play().catch(err => console.log('Video play failed:', err));
  });

  video.addEventListener('mouseleave', () => {
    video.pause();
    video.currentTime = 0;  // Reset to beginning
  });

  // Click/tap play/pause for mobile
  video.addEventListener('click', () => {
    if (video.paused) {
      video.play().catch(err => console.log('Video play failed:', err));
    } else {
      video.pause();
      video.currentTime = 0;
    }
  });

  return video;
}

// Apply layout configuration
function applyLayout(layout) {
  if (!layout) return;

  const root = document.documentElement;

  if (layout.columnGutter) {
    root.style.setProperty('--column-gutter', layout.columnGutter);
  }
  if (layout.sectionSpacing) {
    root.style.setProperty('--section-spacing', layout.sectionSpacing);
  }
}

// Render hero section
function renderHero(project) {
  const { title, year, content } = project;
  const hero = content?.hero || {};

  // Set page title
  document.getElementById('pageTitle').textContent = `${title} - Guccione`;

  // Set hero content
  document.getElementById('heroYear').textContent = year;
  document.getElementById('heroTitle').textContent = hero.title || title;

  const subtitle = document.getElementById('heroSubtitle');
  if (hero.subtitle) {
    subtitle.textContent = hero.subtitle;
    subtitle.style.display = 'block';
  } else {
    subtitle.style.display = 'none';
  }

  // Set hero image/video if present
  const heroImageContainer = document.getElementById('heroImageContainer');
  if (hero.image) {
    // Clear any existing media first (defensive programming)
    heroImageContainer.innerHTML = '';

    let mediaElement;

    if (isVideoFile(hero.image)) {
      // Create video element for hero
      mediaElement = createVideoElement({
        src: hero.image,
        loop: hero.loop,
        muted: hero.muted,
        poster: hero.poster
      });
    } else {
      // Create image element
      mediaElement = document.createElement('img');
      mediaElement.src = normalizeImagePath(hero.image);
      mediaElement.alt = hero.title || title;
    }

    heroImageContainer.appendChild(mediaElement);
  } else {
    heroImageContainer.style.display = 'none';
  }
}

// Render overview section
function renderOverview(project) {
  const overview = project.content?.overview;
  if (!overview) {
    document.getElementById('overviewSection').style.display = 'none';
    return;
  }

  // Render description
  const descriptionDiv = document.getElementById('projectDescription');
  if (overview.longDescription) {
    // Support simple HTML/markdown-like formatting
    const formattedDescription = overview.longDescription
      .split('\n\n')
      .map(para => `<p>${para.trim()}</p>`)
      .join('');
    descriptionDiv.innerHTML = formattedDescription;
  } else {
    descriptionDiv.innerHTML = `<p>${project.description}</p>`;
  }

  // Render metadata
  const metadataDiv = document.getElementById('projectMetadata');
  if (overview.metadata) {
    metadataDiv.innerHTML = '';
    const metadata = overview.metadata;

    if (metadata.role) {
      metadataDiv.appendChild(createMetadataItem('Role', metadata.role));
    }
    if (metadata.client) {
      metadataDiv.appendChild(createMetadataItem('Client', metadata.client));
    }
    if (metadata.duration) {
      metadataDiv.appendChild(createMetadataItem('Duration', metadata.duration));
    }
    if (metadata.collaborators && metadata.collaborators.length > 0) {
      const collabList = `<ul>${metadata.collaborators.map(c => `<li>${c}</li>`).join('')}</ul>`;
      metadataDiv.appendChild(createMetadataItem('Collaborators', collabList));
    }
    if (metadata.technologies && metadata.technologies.length > 0) {
      const techList = metadata.technologies.join(', ');
      metadataDiv.appendChild(createMetadataItem('Technologies', techList));
    }
  } else {
    metadataDiv.style.display = 'none';
  }

  // Render links
  const linksDiv = document.getElementById('projectLinks');
  if (overview.links && overview.links.length > 0) {
    linksDiv.innerHTML = '';
    overview.links.forEach(link => {
      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.label;
      a.className = 'project-link';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      linksDiv.appendChild(a);
    });
  } else {
    linksDiv.style.display = 'none';
  }
}

// Create metadata item
function createMetadataItem(label, value) {
  const div = document.createElement('div');
  div.className = 'metadata-item';

  const labelSpan = document.createElement('span');
  labelSpan.className = 'metadata-label';
  labelSpan.textContent = label;

  const valueDiv = document.createElement('div');
  valueDiv.className = 'metadata-value';
  if (typeof value === 'string' && value.startsWith('<')) {
    valueDiv.innerHTML = value;
  } else {
    valueDiv.textContent = value;
  }

  div.appendChild(labelSpan);
  div.appendChild(valueDiv);
  return div;
}

// Render gallery section
function renderGallery(project) {
  const gallery = project.content?.gallery;
  if (!gallery || !gallery.images || gallery.images.length === 0) {
    document.getElementById('gallerySection').style.display = 'none';
    return;
  }

  const container = document.getElementById('galleryContainer');
  const layout = gallery.layout || 'justified';
  const gutter = gallery.gutter || '1.1rem';

  // Set gutter CSS variable
  document.documentElement.style.setProperty('--gallery-gutter', gutter);

  // Clear container and set layout class
  container.innerHTML = '';
  container.className = `gallery-container gallery-${layout}`;

  switch (layout) {
    case 'justified':
      renderJustifiedGallery(container, gallery);
      break;
    case 'grid':
      renderGridGallery(container, gallery);
      break;
    case 'masonry':
      renderMasonryGallery(container, gallery);
      break;
    case 'slideshow':
      renderSlideshowGallery(container, gallery);
      break;
    default:
      renderJustifiedGallery(container, gallery);
  }
}

// Render justified gallery (like Google Images rows)
function renderJustifiedGallery(container, gallery) {
  const images = gallery.images;
  const targetHeight = 280;
  const gap = parseFloat(gallery.gutter) || 11; // Convert rem to px approximately
  const containerWidth = container.offsetWidth || window.innerWidth - 80;

  // Group images into rows
  let currentRow = [];
  let currentRowWidth = 0;
  const rows = [];

  images.forEach((img, index) => {
    // Load image to get natural dimensions
    const tempImg = new Image();
    tempImg.src = normalizeImagePath(img.src);

    tempImg.onload = function() {
      const aspectRatio = this.naturalWidth / this.naturalHeight;
      const scaledWidth = aspectRatio * targetHeight;

      currentRow.push({
        ...img,
        aspectRatio,
        naturalWidth: this.naturalWidth,
        naturalHeight: this.naturalHeight
      });
      currentRowWidth += scaledWidth + (currentRow.length > 1 ? gap : 0);

      const isLastImage = index === images.length - 1;
      const isRowFull = currentRowWidth >= containerWidth - 100;

      if (isRowFull || isLastImage) {
        rows.push([...currentRow]);
        currentRow = [];
        currentRowWidth = 0;
      }

      // Render when all images are loaded
      if (isLastImage) {
        renderJustifiedRows(container, rows, containerWidth, targetHeight, gap);
      }
    };
  });
}

// Render justified rows
function renderJustifiedRows(container, rows, containerWidth, targetHeight, gap) {
  rows.forEach(rowImages => {
    // Calculate total width for this row
    let totalWidth = 0;
    rowImages.forEach((img, i) => {
      totalWidth += img.aspectRatio * targetHeight;
      if (i < rowImages.length - 1) totalWidth += gap;
    });

    // Scale row to fit container width
    const scalingFactor = Math.min(1, containerWidth / totalWidth);
    const actualHeight = targetHeight * scalingFactor;

    // Create row div
    const rowDiv = document.createElement('div');
    rowDiv.className = 'gallery-row';

    rowImages.forEach(imgData => {
      const actualWidth = imgData.aspectRatio * actualHeight;

      const wrapper = document.createElement('div');
      wrapper.className = 'gallery-image-wrapper';
      wrapper.style.width = `${actualWidth}px`;
      wrapper.style.height = `${actualHeight}px`;

      let mediaElement;

      if (isVideoFile(imgData.src)) {
        // Create video element
        mediaElement = createVideoElement(imgData);
        mediaElement.style.objectFit = 'cover';
      } else {
        // Create image element
        mediaElement = document.createElement('img');
        mediaElement.src = normalizeImagePath(imgData.src);
        mediaElement.alt = imgData.alt || imgData.caption || '';
        mediaElement.loading = 'lazy';
      }

      wrapper.appendChild(mediaElement);

      if (imgData.caption) {
        const caption = document.createElement('div');
        caption.className = 'image-caption';
        caption.textContent = imgData.caption;
        wrapper.appendChild(caption);
      }

      rowDiv.appendChild(wrapper);
    });

    container.appendChild(rowDiv);
  });
}

// Render grid gallery
function renderGridGallery(container, gallery) {
  const columns = gallery.columns || 3;
  document.documentElement.style.setProperty('--gallery-columns', columns);

  gallery.images.forEach(imgData => {
    const wrapper = document.createElement('div');
    wrapper.className = 'gallery-image-wrapper';

    let mediaElement;

    if (isVideoFile(imgData.src)) {
      // Create video element
      mediaElement = createVideoElement(imgData);
      mediaElement.style.objectFit = 'cover';
    } else {
      // Create image element
      mediaElement = document.createElement('img');
      mediaElement.src = normalizeImagePath(imgData.src);
      mediaElement.alt = imgData.alt || imgData.caption || '';
      mediaElement.loading = 'lazy';
    }

    wrapper.appendChild(mediaElement);

    if (imgData.caption) {
      const caption = document.createElement('div');
      caption.className = 'image-caption';
      caption.textContent = imgData.caption;
      wrapper.appendChild(caption);
    }

    container.appendChild(wrapper);
  });
}

// Render masonry gallery
function renderMasonryGallery(container, gallery) {
  const columns = gallery.columns || 3;
  document.documentElement.style.setProperty('--gallery-columns', columns);

  gallery.images.forEach(imgData => {
    const wrapper = document.createElement('div');
    wrapper.className = 'gallery-image-wrapper';

    let mediaElement;

    if (isVideoFile(imgData.src)) {
      // Create video element
      mediaElement = createVideoElement(imgData);
      mediaElement.style.objectFit = 'cover';
    } else {
      // Create image element
      mediaElement = document.createElement('img');
      mediaElement.src = normalizeImagePath(imgData.src);
      mediaElement.alt = imgData.alt || imgData.caption || '';
      mediaElement.loading = 'lazy';
    }

    wrapper.appendChild(mediaElement);

    if (imgData.caption) {
      const caption = document.createElement('div');
      caption.className = 'image-caption';
      caption.textContent = imgData.caption;
      wrapper.appendChild(caption);
    }

    container.appendChild(wrapper);
  });
}

// Render slideshow gallery
function renderSlideshowGallery(container, gallery) {
  gallery.images.forEach(imgData => {
    const wrapper = document.createElement('div');
    wrapper.className = 'gallery-image-wrapper';

    let mediaElement;

    if (isVideoFile(imgData.src)) {
      // Create video element
      mediaElement = createVideoElement(imgData);
      mediaElement.style.objectFit = 'contain';
    } else {
      // Create image element
      mediaElement = document.createElement('img');
      mediaElement.src = normalizeImagePath(imgData.src);
      mediaElement.alt = imgData.alt || imgData.caption || '';
      mediaElement.loading = 'lazy';
    }

    wrapper.appendChild(mediaElement);

    if (imgData.caption) {
      const caption = document.createElement('div');
      caption.className = 'image-caption';
      caption.textContent = imgData.caption;
      wrapper.appendChild(caption);
    }

    container.appendChild(wrapper);
  });
}

// Render custom sections
function renderCustomSections(project) {
  const customSections = project.content?.customSections;
  if (!customSections || customSections.length === 0) {
    return;
  }

  const container = document.getElementById('customSections');
  container.innerHTML = '';

  customSections.forEach(section => {
    const sectionDiv = document.createElement('section');
    sectionDiv.className = `custom-section ${section.type || ''}`;

    if (section.backgroundColor) {
      sectionDiv.style.backgroundColor = section.backgroundColor;
    }

    if (section.title) {
      const title = document.createElement('h2');
      title.className = 'custom-section-title';
      title.textContent = section.title;
      sectionDiv.appendChild(title);
    }

    if (section.content) {
      const content = document.createElement('div');
      content.className = 'custom-section-content';
      // Support HTML content
      if (section.content.includes('<')) {
        content.innerHTML = section.content;
      } else {
        content.textContent = section.content;
      }
      sectionDiv.appendChild(content);
    }

    container.appendChild(sectionDiv);
  });
}

// Show error message
function showError(message) {
  const main = document.getElementById('projectMain');
  main.innerHTML = `
    <div style="text-align: center; padding: 8rem 2rem;">
      <h1 style="font-size: 3rem; margin-bottom: 2rem;">Oops!</h1>
      <p style="font-size: 1.6rem; color: rgba(0,0,0,0.6); margin-bottom: 3rem;">${message}</p>
      <a href="/" style="font-size: 1.4rem; color: #000; text-decoration: none; border-bottom: 1px solid #000;">
        ← Back to Search
      </a>
    </div>
  `;
}

// Store project data globally for resize handling
let currentProjectData = null;

// Initialize page
async function init() {
  const projectId = getProjectId();

  if (!projectId) {
    showError('No project specified');
    return;
  }

  const projectData = await loadProjectData(projectId);

  if (!projectData) {
    return; // Error already shown
  }

  // Store for resize handling
  currentProjectData = projectData;

  // Apply theme and layout
  applyTheme(projectData.theme);
  applyLayout(projectData.layout);

  // Render all sections
  renderHero(projectData);
  renderGallery(projectData);    // MOVED UP - gallery now appears second
  renderOverview(projectData);   // Overview now third
  renderCustomSections(projectData);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Handle window resize for justified gallery
let resizeTimeout;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function() {
    const galleryContainer = document.getElementById('galleryContainer');
    if (galleryContainer && galleryContainer.classList.contains('gallery-justified') && currentProjectData) {
      // Re-render ONLY the gallery, not the entire page
      renderGallery(currentProjectData);
    }
  }, 250);
});

// Handle "Back to Search" button with browser history
document.addEventListener('DOMContentLoaded', function() {
  const backButton = document.getElementById('backToSearch');

  if (backButton) {
    backButton.addEventListener('click', function(e) {
      e.preventDefault();

      // Use browser history
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // Fallback: if opened directly (no history), go to homepage
        window.location.href = '/';
      }
    });
  }

  // Logo should still go to homepage (existing behavior preserved)
});
