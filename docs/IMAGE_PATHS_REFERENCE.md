# Image Paths Reference

## Quick Answer

**Use this format in your JSON files:**
```json
"src": "projects/your-project-id/image.jpg"
```

That's it! The system handles everything else automatically.

---

## The Problem (Fixed)

Previously, the system would blindly prepend `/assets/` to whatever path you provided, causing issues like:

```
Your JSON:        "src": "public/assets/projects/112/bagSide.jpg"
System prepended: "/assets/" + "public/assets/projects/112/bagSide.jpg"
Result:           /assets/public/assets/projects/112/bagSide.jpg  ❌ 404 error
```

## The Solution

The system now uses `normalizeImagePath()` function that intelligently handles any path format you provide.

**How it works:**
1. Removes any leading slashes
2. Removes `public/assets/` prefix if present
3. Removes `assets/` prefix if present
4. Adds `/assets/` prefix to create correct path

---

## Supported Path Formats

All of these work and produce the same result:

### ✅ Format 1: Recommended (Simplest)
```json
"src": "projects/112/bagSide.jpg"
```
**Becomes:** `/assets/projects/112/bagSide.jpg`

### ✅ Format 2: With Leading Slash
```json
"src": "/projects/112/bagSide.jpg"
```
**Becomes:** `/assets/projects/112/bagSide.jpg`

### ✅ Format 3: Full Path
```json
"src": "public/assets/projects/112/bagSide.jpg"
```
**Becomes:** `/assets/projects/112/bagSide.jpg`

### ✅ Format 4: With Assets Prefix
```json
"src": "assets/projects/112/bagSide.jpg"
```
**Becomes:** `/assets/projects/112/bagSide.jpg`

---

## File System Layout

Understanding where files actually live:

```
guccione-browser-search/
├── public/                          (served as root by Express)
│   ├── assets/
│   │   └── projects/
│   │       ├── 112/                 (your project folder)
│   │       │   ├── bagSide.jpg      ← File location
│   │       │   ├── hat1.jpg
│   │       │   └── wearingBagSide.png
│   │       ├── sample-project/
│   │       └── CollectiveComposite/
│   └── project.html
└── data/
    └── projects/
        └── 112.json                 (your project data)
```

**Path mapping:**
```
File on disk:         /public/assets/projects/112/bagSide.jpg
URL in browser:       http://localhost:3000/assets/projects/112/bagSide.jpg
Path in JSON:         "projects/112/bagSide.jpg"
After normalization:  /assets/projects/112/bagSide.jpg
```

---

## Where Paths Are Used

Image paths appear in multiple places in your JSON:

### 1. Thumbnail (for search results)
```json
{
  "id": "my-project",
  "thumbnail": "projects/my-project/thumb.jpg"
}
```

### 2. Hero Image (optional)
```json
{
  "content": {
    "hero": {
      "image": "projects/my-project/hero.jpg"
    }
  }
}
```

### 3. Gallery Images
```json
{
  "gallery": {
    "images": [
      {
        "src": "projects/my-project/image1.jpg",
        "caption": "Caption text",
        "alt": "Alt text"
      }
    ]
  }
}
```

**All of these are normalized automatically!**

---

## Organizing Your Images

### Recommended folder structure:

```
public/assets/projects/
├── your-project-name/
│   ├── thumbnail.jpg          (400x300px, for search results)
│   ├── hero.jpg               (1920x1080px+, optional)
│   ├── image1.jpg             (gallery image)
│   ├── image2.jpg             (gallery image)
│   └── image3.jpg             (gallery image)
```

### Naming conventions:

- Use lowercase, hyphens for spaces: `my-project-name`
- Descriptive filenames: `front-view.jpg` instead of `img1.jpg`
- Keep filenames short and URL-friendly (no spaces, special chars)

---

## Image Optimization Tips

### File sizes:
- **Thumbnails**: 400x300px, < 50KB
- **Gallery images**: 1200-2000px wide, < 500KB
- **Hero images**: 1920x1080px+, < 1MB

### Formats:
- **Photos**: JPG (better compression)
- **Graphics/Screenshots**: PNG (better for text/lines)
- **Consider**: WebP for better compression (modern browsers)

### Tools:
- ImageOptim (Mac)
- TinyPNG (web)
- Squoosh (web)
- Photoshop "Save for Web"

---

## Testing Images

### 1. Check file exists:
```bash
ls public/assets/projects/112/bagSide.jpg
```

### 2. Check web accessibility:
```bash
curl -I http://localhost:3000/assets/projects/112/bagSide.jpg
# Should return: HTTP/1.1 200 OK
```

### 3. Test in browser:
```
http://localhost:3000/assets/projects/112/bagSide.jpg
```

### 4. Check project page:
```
http://localhost:3000/project.html?id=112
```

---

## Common Issues & Solutions

### Issue: "Image not loading / 404 error"

**Check 1:** Does the file exist?
```bash
ls public/assets/projects/your-project/image.jpg
```

**Check 2:** Is the filename case-sensitive?
- `bagSide.jpg` ≠ `bagside.jpg` ≠ `BagSide.jpg`
- Match exactly!

**Check 3:** Is the path in JSON correct?
```json
✅ "src": "projects/112/bagSide.jpg"
❌ "src": "projects/1+1≠2/bagSide.jpg"  (use 112 as folder name, not special chars)
```

**Check 4:** Is the project ID in folder matching?
- JSON file: `112.json`
- Image folder: `public/assets/projects/112/`
- Must match!

### Issue: "Images doubling path"

**Fixed!** The `normalizeImagePath()` function now handles this automatically.

Previously: `/assets/public/assets/projects/...`
Now: `/assets/projects/...`

### Issue: "Mixed formats not working"

**Fixed!** You can now use any path format and it will work:
```json
"images": [
  { "src": "projects/112/image1.jpg" },      // ✅ Works
  { "src": "/projects/112/image2.jpg" },     // ✅ Works
  { "src": "public/assets/projects/112/image3.jpg" } // ✅ Works
]
```

All will correctly load from `/assets/projects/112/imageX.jpg`

---

## Technical Details

### normalizeImagePath() function

Located in: `/public/js/project-loader.js` (lines 83-98)

```javascript
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
```

**Applied in:**
- Hero image rendering (line 138)
- Justified gallery (line 286)
- Grid gallery (line 374)
- Masonry gallery (line 401)
- Slideshow gallery (line 425)

### Express Static File Serving

Located in: `/server/server.js` (line 17)

```javascript
app.use(express.static(path.join(__dirname, '../public')));
```

This serves everything in `/public` as the root:
- `/public/assets/image.jpg` → `http://localhost:3000/assets/image.jpg`
- `/public/project.html` → `http://localhost:3000/project.html`

---

## Best Practices

1. **Use the simplest format**: `projects/my-project/image.jpg`
2. **Keep folder names URL-friendly**: Use project ID as folder name
3. **Optimize images** before adding to reduce page load time
4. **Provide alt text** for accessibility
5. **Add captions** to give context to images
6. **Test in browser** before committing

---

## Examples

### Example 1: Simple project
```json
{
  "id": "algorithmic-portraits",
  "thumbnail": "projects/algorithmic-portraits/thumb.jpg",
  "content": {
    "gallery": {
      "images": [
        { "src": "projects/algorithmic-portraits/portrait-1.jpg" },
        { "src": "projects/algorithmic-portraits/portrait-2.jpg" }
      ]
    }
  }
}
```

**Folder structure:**
```
public/assets/projects/algorithmic-portraits/
├── thumb.jpg
├── portrait-1.jpg
└── portrait-2.jpg
```

### Example 2: Project with hero
```json
{
  "id": "light-field",
  "thumbnail": "projects/light-field/thumb.jpg",
  "content": {
    "hero": {
      "image": "projects/light-field/hero.jpg"
    },
    "gallery": {
      "images": [
        { "src": "projects/light-field/install-1.jpg" },
        { "src": "projects/light-field/install-2.jpg" }
      ]
    }
  }
}
```

**Folder structure:**
```
public/assets/projects/light-field/
├── thumb.jpg
├── hero.jpg
├── install-1.jpg
└── install-2.jpg
```

---

**Last Updated**: 2025-11-17
**Status**: Fixed and working
**Related Docs**: CONTENT_MANAGEMENT.md, API_ARCHITECTURE.md
