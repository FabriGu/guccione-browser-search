# Guccione Browser - Content Management System

Complete guide for managing project content in your portfolio using the JSON-driven template system.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Project JSON Structure](#project-json-structure)
4. [Theme Customization](#theme-customization)
5. [Gallery Layouts](#gallery-layouts)
6. [Video Support](#video-support)
7. [Adding New Projects](#adding-new-projects)
8. [Updating Search Index](#updating-search-index)
9. [Examples](#examples)

---

## Overview

The Guccione Browser portfolio uses a **JSON-driven template system** that allows you to:

- Create unique project pages with custom themes and layouts
- Manage all content in simple JSON files (no coding required)
- Use flexible grid-based positioning for sophisticated layouts
- Choose from multiple gallery layout options
- Maintain minimalist aesthetic inspired by jnackash.com, shuangli.info, and shuangcai.cargo.site

**Architecture:**
- **Project Data**: `/data/projects/<project-id>.json` - Contains all project content
- **Template**: `/public/project.html` - Single HTML template for all projects
- **Loader**: `/public/js/project-loader.js` - JavaScript that reads JSON and renders content
- **Styles**: `/public/css/project.css` - Minimalist CSS with customizable CSS variables

---

## Quick Start

### Adding a New Project (5 minutes setup + rebuild time)

1. **Create project JSON file** in `/data/projects/`:
   ```bash
   cp data/projects/sample-project.json data/projects/my-new-project.json
   ```

2. **Edit the JSON file** with your project details:
   ```json
   {
     "id": "my-new-project",
     "title": "My Amazing Project",
     "year": "2024",
     "description": "Short description for search results",
     "tags": ["interactive", "web", "creative-coding"],
     ...
   }
   ```

3. **Add project images/videos** to `/public/assets/projects/my-new-project/`

4. **Update the gallery images array** in your JSON to reference these media files

5. **View your project directly** at: `http://localhost:3000/project.html?id=my-new-project`
   - Project page works immediately
   - Not searchable yet (next step)

6. **Make it searchable** - Rebuild the search index:
   ```bash
   npm run rebuild
   ```
   Then restart your server:
   ```bash
   npm run dev
   ```

That's it! Your project is now live and searchable.

---

## Project JSON Structure

### Required Fields

```json
{
  "id": "unique-project-id",        // URL-friendly identifier (lowercase, hyphens)
  "title": "Project Title",         // Display title
  "year": "2024",                   // Year or date range
  "thumbnail": "path/to/thumb.jpg", // Thumbnail for search results
  "description": "Short desc..."    // For search results (160 chars max)
}
```

### Optional Fields

#### Tags
```json
"tags": ["interactive", "installation", "generative", "web"]
```
Used for categorization and search.

#### Theme Configuration
```json
"theme": {
  "backgroundColor": "#ffffff",              // Page background
  "accentColor": "#ff0000",                  // Links and highlights
  "textColor": "rgba(0, 0, 0, 0.85)",       // Primary text
  "secondaryTextColor": "rgba(0, 0, 0, 0.6)", // Metadata, captions
  "fontFamily": "Cormorant Garamond, serif"  // Any font (Google Fonts auto-loaded)
}
```

**Background Color Examples:**
- White minimalist: `#ffffff`
- Dark mode: `rgb(40, 40, 40)` (like jnackash.com)
- Bold accent: `rgba(255, 18, 34, 1)` (like shuangli.info)
- Gradient: Use CSS gradients

**Font Examples:**
- System fonts: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Google Fonts: `Cormorant Garamond, serif` (auto-loaded)
- Monospace: `IBM Plex Mono, monospace`

#### Layout Configuration
```json
"layout": {
  "type": "default",          // "default" | "full-bleed" | "asymmetric" | "gallery-focus"
  "columnGutter": "5rem",     // Space between columns
  "sectionSpacing": "6rem"    // Vertical space between sections
}
```

---

## Content Sections

### 1. Hero Section
```json
"content": {
  "hero": {
    "title": "Override project title if needed",
    "subtitle": "Optional tagline or subtitle",
    "image": "projects/my-project/hero.jpg"  // Optional hero image
  }
}
```

**Default behavior**: Uses main title and year if hero.title not specified.

### 2. Overview Section
```json
"overview": {
  "longDescription": "Detailed multi-paragraph description.\n\nSupports paragraph breaks with \\n\\n.",

  "metadata": {
    "role": "Creative Technologist",
    "client": "Client Name or Personal Project",
    "duration": "2 weeks",
    "collaborators": ["Designer Name", "Developer Name"],
    "technologies": ["p5.js", "TensorFlow.js", "WebGL"]
  },

  "links": [
    {
      "label": "View Live Site",
      "url": "https://example.com"
    },
    {
      "label": "GitHub Repository",
      "url": "https://github.com/username/repo"
    }
  ]
}
```

**Layout**: Uses 3-column grid pattern inspired by shuangcai.cargo.site:
- Column 1 (narrow): Section label
- Column 2 (medium): Description, metadata, links
- Column 3 (wide): Can be used by custom sections

---

## Gallery Layouts

### 1. Justified Layout (Default)
Like Google Images - rows of images with same height, variable widths.

```json
"gallery": {
  "layout": "justified",
  "gutter": "1.1rem",
  "images": [
    {
      "src": "projects/my-project/image1.jpg",
      "caption": "Image caption",
      "alt": "Accessibility description"
    }
  ]
}
```

**Best for**: Mixed aspect ratios, photography, portfolios

### 2. Grid Layout
Equal-sized image cells arranged in columns.

```json
"gallery": {
  "layout": "grid",
  "columns": 3,              // 2-6 columns
  "gutter": "1.1rem",
  "images": [...]
}
```

**Best for**: Thumbnails, square images, uniform collections

### 3. Masonry Layout
Pinterest-style columns with variable heights.

```json
"gallery": {
  "layout": "masonry",
  "columns": 3,
  "gutter": "1.1rem",
  "images": [...]
}
```

**Best for**: Portrait/landscape mix, varied aspect ratios

### 4. Slideshow Layout
Full-width images stacked vertically.

```json
"gallery": {
  "layout": "slideshow",
  "images": [...]
}
```

**Best for**: Sequential storytelling, process documentation

### Image Object Structure
```json
{
  "src": "projects/my-project/image.jpg",  // Path to image (see Image Paths below)
  "caption": "Descriptive caption",         // Displayed below image
  "alt": "Alt text for screen readers",    // Accessibility
  "width": 2                                // Optional: column span (1-6) for custom layouts
}
```

### Image Paths - Important!

The system automatically normalizes image paths, so you can use any of these formats:

**✅ Recommended (simplest):**
```json
"src": "projects/my-project/image.jpg"
```

**✅ Also works (with leading slash):**
```json
"src": "/projects/my-project/image.jpg"
```

**✅ Also works (full path):**
```json
"src": "public/assets/projects/my-project/image.jpg"
```

**How it works:**
- Your image files live in `/public/assets/projects/my-project/`
- The server serves `/public` as the root, so images are accessible at `/assets/projects/my-project/image.jpg`
- The loader automatically adds `/assets/` prefix and removes any duplicate paths
- Use the simplest format (`projects/my-project/image.jpg`) to avoid confusion

**Example mapping:**
```
File location:     /public/assets/projects/112/bagSide.jpg
Your JSON:         "src": "projects/112/bagSide.jpg"
Browser requests:  http://localhost:3000/assets/projects/112/bagSide.jpg
```

---

## Video Support

The Guccione Browser now supports **native video playback** in galleries and hero sections. Videos integrate seamlessly with images and support hover/tap interactions.

### Video Behavior

**Desktop (hover interaction):**
- Hover over video → plays automatically
- Move mouse away → pauses and resets to beginning

**Mobile/Tablet (tap interaction):**
- Tap video → plays
- Tap again → pauses and resets to beginning

Videos have **no visible controls** for a clean, minimal aesthetic that matches the overall design philosophy.

### Video Object Structure

Videos use the same structure as images, with additional parameters:

```json
{
  "src": "projects/my-project/demo.mp4",     // Path to video file
  "caption": "Video caption",                 // Optional: displayed below video
  "alt": "Video description",                 // Optional: accessibility
  "loop": true,                               // Optional: loop video (default: false)
  "muted": false,                            // Optional: mute audio (default: false)
  "poster": "projects/my-project/thumb.jpg"  // Optional: thumbnail before play
}
```

### Video Parameters

#### `loop` (boolean, default: `false`)
Controls whether the video loops continuously.

```json
// Video plays once and stops
{"src": "projects/demo/video.mp4", "loop": false}

// Video loops continuously
{"src": "projects/demo/video.mp4", "loop": true}
```

#### `muted` (boolean, default: `false`)
Controls audio playback.

```json
// Video plays with sound
{"src": "projects/demo/video.mp4", "muted": false}

// Video plays silently
{"src": "projects/demo/video.mp4", "muted": true}
```

**Note**: For videos that autoplay on hover, unmuted audio may be blocked by browser autoplay policies. Videos with `muted: false` will play with sound when clicked/tapped.

#### `poster` (string, optional)
Thumbnail image displayed before video plays.

```json
{
  "src": "projects/demo/video.mp4",
  "poster": "projects/demo/video-thumb.jpg"
}
```

If no poster is provided, browsers will use the first frame of the video.

### Supported Video Formats

- **MP4** (.mp4, .MP4) - Recommended for best compatibility
- **WebM** (.webm, .WEBM) - Excellent quality/size ratio
- **MOV** (.mov, .MOV) - macOS/iOS native format

**Recommendation**: Use H.264 encoded MP4 for maximum browser compatibility.

### Video in Galleries

Videos can be mixed with images in any gallery layout. The system automatically detects video files by extension.

#### Example: Justified Gallery with Mixed Media

```json
"gallery": {
  "layout": "justified",
  "gutter": "1.1rem",
  "images": [
    {
      "src": "projects/my-project/image1.jpg",
      "caption": "Static image"
    },
    {
      "src": "projects/my-project/demo.mp4",
      "caption": "Interactive demo",
      "loop": true,
      "muted": true
    },
    {
      "src": "projects/my-project/image2.jpg",
      "caption": "Another image"
    },
    {
      "src": "projects/my-project/process.mp4",
      "caption": "Process video",
      "loop": false,
      "muted": false,
      "poster": "projects/my-project/process-thumb.jpg"
    }
  ]
}
```

**Note**: Despite the field name being "images", the array can contain both image and video objects.

#### Example: Grid Gallery with Videos

```json
"gallery": {
  "layout": "grid",
  "columns": 3,
  "gutter": "1.1rem",
  "images": [
    {"src": "projects/demo/screen1.jpg"},
    {"src": "projects/demo/interaction.mp4", "loop": true, "muted": true},
    {"src": "projects/demo/screen2.jpg"},
    {"src": "projects/demo/detail.mp4", "loop": true, "muted": true},
    {"src": "projects/demo/screen3.jpg"},
    {"src": "projects/demo/screen4.jpg"}
  ]
}
```

Grid and Masonry layouts use `object-fit: cover` to crop videos to fit cells perfectly.

#### Example: Slideshow Gallery with Videos

```json
"gallery": {
  "layout": "slideshow",
  "images": [
    {"src": "projects/story/intro.jpg", "caption": "Introduction"},
    {"src": "projects/story/process.mp4", "caption": "Process video", "muted": false},
    {"src": "projects/story/result.jpg", "caption": "Final result"}
  ]
}
```

Slideshow layout uses `object-fit: contain` to show entire video without cropping.

### Video in Hero Section

Use videos as hero images for dynamic project introductions.

```json
"content": {
  "hero": {
    "title": "Project Title",
    "subtitle": "Dynamic project introduction",
    "image": "projects/my-project/hero-video.mp4",
    "loop": true,
    "muted": true,
    "poster": "projects/my-project/hero-poster.jpg"
  }
}
```

**Best practices for hero videos:**
- Keep videos short (5-15 seconds for loops)
- Use `loop: true` and `muted: true` for ambient background videos
- Optimize file size (< 5MB recommended)
- Provide a poster image for faster initial page load

### Video Guidelines

#### File Size Optimization
- **Keep videos under 10MB** for gallery items
- **Keep hero videos under 5MB** if using loop
- Use video compression tools (HandBrake, FFmpeg)
- Consider WebM format for better compression

#### Encoding Recommendations
```bash
# Example FFmpeg command for web-optimized video
ffmpeg -i input.mov -c:v libx264 -crf 23 -preset slow -c:a aac -b:a 128k output.mp4
```

Parameters explained:
- `-crf 23`: Quality (lower = better, 23 is good balance)
- `-preset slow`: Better compression (slower encode)
- `-b:a 128k`: Audio bitrate

#### Accessibility
Always provide captions for videos:
```json
{
  "src": "projects/demo/video.mp4",
  "caption": "Interactive prototype showing gesture-based navigation",
  "alt": "Video demonstration of gesture navigation interface"
}
```

#### Performance Considerations
- Videos use `preload="metadata"` to load only metadata initially
- Full video data loads when user hovers/clicks
- Multiple videos on one page is fine - they only load when needed
- Use poster images to reduce initial bandwidth

### Troubleshooting Videos

#### Video not playing
- **Check file format**: Must be .mp4, .mov, or .webm
- **Check file path**: Use same path format as images (`projects/id/video.mp4`)
- **Check file size**: Very large videos may timeout loading
- **Check browser console**: Look for network errors or playback errors

#### Video plays but no sound
- **Check muted parameter**: Set to `false` if you want audio
- **Browser autoplay policy**: Browsers may block unmuted autoplay on hover
- **User interaction required**: Sound works reliably on tap/click

#### Video doesn't loop
- **Check loop parameter**: Set to `true` in your JSON
- **Verify JSON syntax**: Ensure boolean value (not string "true")

#### Video quality issues
- **Re-encode video**: Use recommended FFmpeg settings above
- **Check source quality**: Can't improve beyond source material
- **Consider resolution**: 1920x1080 is usually sufficient

#### Video too large/slow to load
- **Compress video**: Use lower CRF value or WebM format
- **Reduce resolution**: 1280x720 may be adequate for galleries
- **Shorten duration**: Keep loops under 10 seconds
- **Add poster image**: Provides instant visual feedback

---

## Custom Sections

Add additional content sections beyond hero/overview/gallery:

```json
"customSections": [
  {
    "type": "text",
    "title": "Design Process",
    "content": "<p>HTML content supported.</p><p>Use paragraph tags.</p>",
    "columnSpan": 6,
    "backgroundColor": "#f5f5f5"  // Optional background override
  },
  {
    "type": "quote",
    "content": "Simplicity is the ultimate sophistication."
  },
  {
    "type": "two-column",
    "title": "Technical Details",
    "content": "<div>Left column content</div><div>Right column content</div>"
  }
]
```

**Section Types:**
- `text` - Standard content block
- `quote` - Styled blockquote with left border
- `two-column` - Side-by-side layout
- `image` - Standalone image
- `video` - Embedded video
- `embed` - Custom HTML embed

---

## Theme Customization

### Preset Themes

#### Minimalist White (Default)
```json
"theme": {
  "backgroundColor": "#ffffff",
  "accentColor": "#000000",
  "textColor": "rgba(0, 0, 0, 0.85)",
  "secondaryTextColor": "rgba(0, 0, 0, 0.6)",
  "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
}
```

#### Dark Mode (jnackash.com inspired)
```json
"theme": {
  "backgroundColor": "rgb(40, 40, 40)",
  "accentColor": "rgb(204, 204, 204)",
  "textColor": "rgb(204, 204, 204)",
  "secondaryTextColor": "rgba(204, 204, 204, 0.7)",
  "fontFamily": "Work Sans, sans-serif"
}
```

#### Bold Accent (shuangli.info inspired)
```json
"theme": {
  "backgroundColor": "rgba(255, 18, 34, 1)",
  "accentColor": "#000000",
  "textColor": "rgba(0, 0, 0, 1)",
  "secondaryTextColor": "rgba(0, 0, 0, 0.75)",
  "fontFamily": "Cormorant Garamond, serif"
}
```

#### Monochrome Minimal (shuangcai.cargo.site inspired)
```json
"theme": {
  "backgroundColor": "#ffffff",
  "accentColor": "#ff0000",
  "textColor": "rgba(0, 0, 0, 0.85)",
  "secondaryTextColor": "rgba(0, 0, 0, 0.5)",
  "fontFamily": "sans-serif"
}
```

### Advanced Customization

For advanced styling beyond JSON theme options, you can:

1. **Add custom CSS classes** in project.css targeting specific project IDs:
   ```css
   body[data-project-id="my-special-project"] {
     /* Custom styles */
   }
   ```

2. **Use inline styles** in customSections content (HTML)

3. **Create new layout types** by modifying project-loader.js (requires JavaScript knowledge)

---

## Adding New Projects

### Step-by-Step Workflow

#### 1. Prepare Project Assets

Create project directory:
```bash
mkdir -p public/assets/projects/my-new-project
```

Add images:
```
public/assets/projects/my-new-project/
  ├── thumbnail.jpg       (for search results)
  ├── hero.jpg           (optional hero image)
  ├── image1.jpg
  ├── image2.jpg
  └── image3.jpg
```

**Image Guidelines:**
- Thumbnails: 400x300px (4:3 ratio)
- Gallery images: Any size, optimize for web (< 500KB recommended)
- Hero images: 1920x1080px or larger
- Formats: JPG (photos), PNG (graphics/screenshots)

#### 2. Create Project JSON

Copy template:
```bash
cp data/projects/sample-project.json data/projects/my-new-project.json
```

Edit with your content (see [Project JSON Structure](#project-json-structure))

#### 3. Test Locally

Start dev server:
```bash
npm run dev
```

View project:
```
http://localhost:3000/project.html?id=my-new-project
```

#### 4. Update Search Index

Run the rebuild command to make your project searchable:

```bash
npm run rebuild
```

This automatically:
- Adds your project to the works index
- Generates text embeddings for semantic search
- Catalogs your project images
- Generates image embeddings for visual search

**First run**: Downloads ML models (~700MB, 30-60 min)
**Subsequent runs**: Much faster (~5-10 min)

After completion, restart your server and test search.

See [Updating Search Index](#updating-search-index) for details and troubleshooting.

---

## Updating Search Index

After adding new projects, you need to rebuild the search index so they appear in search results. The system automatically generates embeddings for both text search (MiniLM) and image search (CLIP).

### Quick Method: Rebuild Everything

**Recommended for adding new projects:**

```bash
npm run rebuild
```

This single command runs all four steps automatically:
1. Builds `data/works.json` from all project JSONs in `data/projects/`
2. Generates text embeddings (MiniLM) for semantic text search
3. Builds image catalog from all project images
4. Generates image embeddings (CLIP) for visual search

**First run will download ML models (~700MB) and can take 30-60 minutes.**
Subsequent runs are much faster (only processing new content).

After completion:
1. Restart your server: `npm run dev` or `npm start`
2. Test search at: http://localhost:3000
3. Your new projects should appear in search results

### Individual Steps (Advanced)

If you only need to update specific parts of the index:

#### 1. Build Works Index Only
```bash
npm run build:works
```
- Scans all JSON files in `data/projects/`
- Creates `data/works.json` with project metadata
- No embeddings generated (search won't work yet)
- Fast (< 1 second)

#### 2. Generate Text Embeddings Only
```bash
npm run embed:text
```
- Reads `data/works.json`
- Generates MiniLM embeddings for project descriptions
- Creates `data/works-with-embeddings.json`
- Required for text/semantic search to work
- Medium speed (~1-5 minutes for dozens of projects)

#### 3. Build Image Catalog Only
```bash
npm run build:images
```
- Scans `public/assets/projects/` for images
- Creates `data/image-catalog.json` with image paths
- No embeddings generated
- Fast (< 1 second)

#### 4. Generate Image Embeddings Only
```bash
npm run embed:images
```
- Reads `data/image-catalog.json`
- Generates CLIP embeddings for each image
- Creates `data/image-embeddings.json`
- Required for visual search to work
- Slow (~30-60 minutes for hundreds of images)

### Complete Workflow Example

**Scenario:** You just added 3 new projects

```bash
# 1. Verify your project files are in place
ls data/projects/
# Should show: project1.json, project2.json, project3.json, ...

ls public/assets/projects/
# Should show directories: project1/, project2/, project3/, ...

# 2. Rebuild entire search index
npm run rebuild

# Wait for completion (first run downloads models, ~30-60 min)
# Subsequent runs are faster (~5-10 min)

# 3. Restart server
npm run dev

# 4. Test in browser
# Navigate to http://localhost:3000
# Search for your new projects by name, description, or visual content
```

### What Gets Generated

After running `npm run rebuild`, these files are created/updated:

- `data/works.json` - Raw project index (no embeddings)
- `data/works-with-embeddings.json` - Projects with MiniLM text embeddings
- `data/image-catalog.json` - Image paths catalog
- `data/image-embeddings.json` - Images with CLIP visual embeddings

**Important:** These files are auto-generated. Never edit them manually! Always edit the source project JSONs in `data/projects/` and rebuild.

### Performance Notes

- **Text embeddings**: ~0.1-0.5 seconds per project
- **Image embeddings**: ~1-3 seconds per image
- **Video embeddings**: ~3-4 seconds per video (extracts first frame at 0.1 seconds)
- First run downloads models to `.cache/` (kept for future runs)
- Only new/changed projects/images/videos need reprocessing on subsequent runs
- Videos use 1280px frame width for high quality embeddings (no impact on search speed)

### Troubleshooting Index Updates

#### Projects don't appear in search after rebuild
- Check that JSON file is in `data/projects/` (not a subdirectory)
- Verify JSON syntax is valid (use a JSON validator)
- Check console output during rebuild for errors
- Ensure `id` field in JSON matches filename (without .json)
- Restart server after rebuild completes

#### Rebuild takes too long or fails
- First run downloads models (~700MB) - this is normal
- Close other intensive applications
- Ensure stable internet connection for model download
- Check disk space (models + embeddings can be large)
- For large image sets (>500 images), consider running `npm run embed:images` separately overnight

#### Images don't appear in image search
- Verify images are in `public/assets/projects/[project-id]/`
- Check file formats are supported (JPG, PNG)
- Ensure image paths in JSON match actual file locations
- Run `npm run build:images` to verify catalog is built
- Check `data/image-catalog.json` contains your images

#### Changes not reflected after rebuild
- Make sure you restarted the server (`npm run dev`)
- Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Check server console for errors loading embeddings
- Verify `data/works-with-embeddings.json` has recent timestamp

#### Videos showing errors during embedding generation
- Videos are automatically supported since v1.1
- Dependencies (@ffmpeg-installer/ffmpeg, fluent-ffmpeg) installed automatically with `npm install`
- Videos extract first frame at 0.1 seconds for visual search embeddings
- Processing ~3-4 seconds per video (slower than images ~1-3 sec)
- Check `/tmp` directory is writable for frame extraction
- If ffmpeg fails, verify dependencies: `npm ls @ffmpeg-installer/ffmpeg fluent-ffmpeg`
- Supported formats: .mp4, .mov, .webm (case-insensitive)

#### Server won't start - port already in use
- The `predev` script automatically kills processes on port 3000
- If server still won't start, manually kill: `lsof -ti:3000 | xargs kill -9`
- Check for zombie processes: `ps aux | grep node`

---

## Examples

### Example 1: Simple Portfolio Project

```json
{
  "id": "algorithmic-portraits",
  "title": "Algorithmic Portraits",
  "year": "2024",
  "thumbnail": "projects/algo-portraits/thumb.jpg",
  "description": "Generative portrait series exploring computational aesthetics",
  "tags": ["generative", "p5js", "portraits"],

  "theme": {
    "backgroundColor": "#ffffff",
    "accentColor": "#4285F4"
  },

  "content": {
    "overview": {
      "longDescription": "This project explores the intersection of portraiture and algorithmic processes...",
      "metadata": {
        "role": "Creative Technologist",
        "technologies": ["p5.js", "ml5.js"]
      }
    },

    "gallery": {
      "layout": "justified",
      "images": [
        {"src": "projects/algo-portraits/1.jpg", "caption": "Portrait 1"},
        {"src": "projects/algo-portraits/2.jpg", "caption": "Portrait 2"},
        {"src": "projects/algo-portraits/3.jpg", "caption": "Portrait 3"}
      ]
    }
  }
}
```

### Example 2: Installation with Custom Sections

```json
{
  "id": "light-field",
  "title": "Light Field",
  "year": "2023-2024",
  "thumbnail": "projects/light-field/thumb.jpg",
  "description": "Interactive light installation responding to movement",
  "tags": ["installation", "interactive", "physical-computing"],

  "theme": {
    "backgroundColor": "rgb(40, 40, 40)",
    "accentColor": "rgb(204, 204, 204)",
    "textColor": "rgb(204, 204, 204)",
    "fontFamily": "Work Sans, sans-serif"
  },

  "layout": {
    "columnGutter": "6rem",
    "sectionSpacing": "8rem"
  },

  "content": {
    "hero": {
      "subtitle": "An exploration of light, movement, and interaction",
      "image": "projects/light-field/hero.jpg"
    },

    "overview": {
      "longDescription": "Light Field is an interactive installation...",
      "metadata": {
        "role": "Artist & Creative Technologist",
        "collaborators": ["Sound Designer", "Fabricator"],
        "technologies": ["Arduino", "Processing", "DMX"],
        "client": "Gallery XYZ",
        "duration": "3 months"
      },
      "links": [
        {"label": "Exhibition Info", "url": "https://gallery.com/light-field"}
      ]
    },

    "gallery": {
      "layout": "slideshow",
      "images": [
        {"src": "projects/light-field/install-1.jpg", "caption": "Installation view"},
        {"src": "projects/light-field/detail-1.jpg", "caption": "Detail"},
        {"src": "projects/light-field/interaction.jpg", "caption": "Visitor interaction"}
      ]
    },

    "customSections": [
      {
        "type": "text",
        "title": "Concept",
        "content": "<p>The installation creates a responsive environment...</p>"
      },
      {
        "type": "video",
        "content": "<iframe src='https://player.vimeo.com/video/...' /></iframe>"
      },
      {
        "type": "quote",
        "content": "Light is not so much something that reveals, as it is itself the revelation."
      }
    ]
  }
}
```

### Example 3: Web Project with Grid Gallery

```json
{
  "id": "data-visualization",
  "title": "Climate Data Visualization",
  "year": "2024",
  "thumbnail": "projects/climate-viz/thumb.jpg",
  "description": "Interactive web visualization of climate data",
  "tags": ["web", "data-viz", "d3js"],

  "theme": {
    "backgroundColor": "#ffffff",
    "accentColor": "#ff0000",
    "fontFamily": "IBM Plex Mono, monospace"
  },

  "content": {
    "overview": {
      "longDescription": "An interactive web application visualizing...",
      "metadata": {
        "role": "Data Visualization Designer",
        "technologies": ["D3.js", "React", "Node.js"],
        "duration": "1 month"
      },
      "links": [
        {"label": "Live Site", "url": "https://climate-viz.com"},
        {"label": "GitHub", "url": "https://github.com/user/climate-viz"}
      ]
    },

    "gallery": {
      "layout": "grid",
      "columns": 2,
      "images": [
        {"src": "projects/climate-viz/home.jpg", "caption": "Homepage"},
        {"src": "projects/climate-viz/detail.jpg", "caption": "Detail view"},
        {"src": "projects/climate-viz/mobile.jpg", "caption": "Mobile design"},
        {"src": "projects/climate-viz/data.jpg", "caption": "Data view"}
      ]
    },

    "customSections": [
      {
        "type": "two-column",
        "title": "Technical Approach",
        "content": "<div><h3>Frontend</h3><p>React + D3.js...</p></div><div><h3>Backend</h3><p>Node.js API...</p></div>"
      }
    ]
  }
}
```

---

## Responsive Design

Project pages are fully responsive with breakpoints:

- **Desktop** (> 991px): Full 2-column grid, large typography
- **Tablet** (768px - 991px): Adjusted gutters, smaller text
- **Mobile** (< 768px): Single column, stacked layout, optimized navigation

Gallery layouts adapt automatically:
- **Justified**: Adjusts row heights
- **Grid/Masonry**: Reduces columns (3 → 2 → 1)
- **Slideshow**: Always full-width

---

## Troubleshooting

### Project not appearing in search results
- Check that project JSON exists in `/data/projects/`
- Verify `id` field matches filename (without .json)
- Ensure backend has indexed the project
- Check browser console for errors

### Images not loading
- Verify image paths are relative to `/public/assets/`
- Check image files exist at specified paths
- Ensure images are web-optimized formats (JPG, PNG)
- Check browser network tab for 404 errors

### Theme not applying
- Verify theme object syntax is valid JSON
- Check color values are valid CSS (hex, rgb, rgba)
- Ensure fontFamily names are correct
- Clear browser cache and reload

### Layout issues
- Check that columnGutter and sectionSpacing use valid CSS units
- Verify layout.type is one of: default, full-bleed, asymmetric, gallery-focus
- Test on different screen sizes
- Check browser console for JavaScript errors

### Gallery not rendering
- Verify gallery.layout is one of: justified, grid, masonry, slideshow
- Check that images array is not empty
- Ensure image objects have required "src" field
- Check that gutter value is valid CSS unit

---

## Next Steps

1. **Create your first project** using the Quick Start guide
2. **Experiment with themes** to match your aesthetic
3. **Try different gallery layouts** for various project types
4. **Add custom sections** for unique content needs
5. **Generate embeddings** to make projects searchable

For questions or issues, refer to:
- JSON Schema: `/data/projects/schema.json`
- Sample Project: `/data/projects/sample-project.json`
- Project Template: `/public/project.html`
- Loader Code: `/public/js/project-loader.js`

---

**Last Updated**: 2026-01-19
**System Version**: 1.1 (Added video support)
**Inspired by**: jnackash.com, shuangli.info, shuangcai.cargo.site
