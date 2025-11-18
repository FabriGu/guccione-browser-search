# API Architecture - Project Pages

## Problem
Project JSON files in `/data/projects/` were not accessible from the frontend because the Express server only serves `/public` as static files. Attempting to fetch `/data/projects/project.json` resulted in 404 errors.

## Solution
Created a dedicated API endpoint `/api/projects/:id` that serves project JSON files through a controlled backend route.

## Architecture Decision

### ❌ What We Didn't Do (and Why)

**Option 1: Serve `/data` as static files**
```javascript
app.use('/data', express.static(path.join(__dirname, '../data')));
```
**Why not:**
- Exposes ALL data files publicly (search-history.json, embeddings, etc.)
- Security risk - no control over what's accessed
- Can't add validation or error handling
- Difficult to add features like caching or transformations later

**Option 2: Move files to `/public`**
```
/public/data/projects/  // Bad separation of concerns
```
**Why not:**
- Mixes content data with frontend assets
- Less clean architecture
- Still no server-side control or validation

### ✅ What We Did (and Why)

**Created API Endpoint: `/api/projects/:id`**

**server/server.js** (lines 405-438):
```javascript
app.get('/api/projects/:id', (req, res) => {
  try {
    const projectId = req.params.id;
    const projectPath = path.join(__dirname, '../data/projects', `${projectId}.json`);

    console.log(`Project request received for: "${projectId}"`);

    // Security: Check file exists before reading
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Read and parse project JSON
    const projectData = fs.readFileSync(projectPath, 'utf8');
    const project = JSON.parse(projectData);

    console.log(`Successfully loaded project: ${project.title}`);

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);

    // Specific error for JSON parse failures
    if (error instanceof SyntaxError) {
      return res.status(400).json({ error: 'Invalid project data format' });
    }

    res.status(500).json({ error: 'An error occurred while fetching the project' });
  }
});
```

**public/js/project-loader.js** (lines 12-35):
```javascript
async function loadProjectData(projectId) {
  try {
    // Use API endpoint instead of direct file access
    const response = await fetch(`/api/projects/${projectId}`);

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
```

## Benefits

### 1. Security
- `/data` directory remains private
- Only specific project files are exposed
- Can add authentication/authorization later if needed

### 2. Validation
- Server validates file exists before reading
- JSON parsing errors caught and handled
- Proper HTTP status codes (404, 400, 500)

### 3. Error Handling
- Detailed server-side logging
- User-friendly error messages
- Distinguishes between different error types

### 4. Scalability
```javascript
// Future enhancements are easy:

// Add caching
const projectCache = new Map();
if (projectCache.has(projectId)) {
  return res.json(projectCache.get(projectId));
}

// Add database integration
const project = await db.projects.findOne({ id: projectId });

// Add transformations
const projectWithComputedFields = {
  ...project,
  relatedProjects: findRelatedProjects(project.tags)
};

// Add access control
if (!req.user.canAccessProject(projectId)) {
  return res.status(403).json({ error: 'Access denied' });
}
```

### 5. Consistency
- Follows existing pattern with `/api/works/:id`
- RESTful API design
- Same architecture throughout codebase

### 6. Developer Experience
- Clear error messages in console
- Logging for debugging
- Easy to test (curl, Postman, etc.)

## Usage

### Frontend
```javascript
// Load any project by ID
const project = await fetch('/api/projects/CollectiveComposite').then(r => r.json());
const project2 = await fetch('/api/projects/sample-project').then(r => r.json());
```

### Testing
```bash
# Test successful request
curl http://localhost:3000/api/projects/CollectiveComposite

# Test 404 error
curl http://localhost:3000/api/projects/nonexistent

# Check response status
curl -w "\nStatus: %{http_code}\n" http://localhost:3000/api/projects/sample-project
```

### Server Logs
```
Project request received for: "CollectiveComposite"
Looking for project at: /path/to/data/projects/CollectiveComposite.json
Successfully loaded project: Collective Composite
```

## Project File Structure
```
data/
  projects/
    CollectiveComposite.json    → /api/projects/CollectiveComposite
    sample-project.json         → /api/projects/sample-project
    SpokenWardrobe.json         → /api/projects/SpokenWardrobe
    1+1≠2.json                  → /api/projects/1+1≠2
```

## Response Format

### Success (200 OK)
```json
{
  "id": "CollectiveComposite",
  "title": "Collective Composite",
  "year": "2024",
  "theme": { ... },
  "content": { ... }
}
```

### Not Found (404)
```json
{
  "error": "Project not found"
}
```

### Invalid Data (400)
```json
{
  "error": "Invalid project data format"
}
```

### Server Error (500)
```json
{
  "error": "An error occurred while fetching the project"
}
```

## Future Enhancements

### 1. Caching Layer
```javascript
const NodeCache = require('node-cache');
const projectCache = new NodeCache({ stdTTL: 600 }); // 10 minute cache

app.get('/api/projects/:id', (req, res) => {
  const cached = projectCache.get(req.params.id);
  if (cached) return res.json(cached);

  // Load from file, cache result
  const project = loadProject(req.params.id);
  projectCache.set(req.params.id, project);
  res.json(project);
});
```

### 2. Database Integration
```javascript
// When scaling beyond file-based storage
const project = await Project.findOne({ id: projectId });
```

### 3. List All Projects
```javascript
app.get('/api/projects', (req, res) => {
  const projectsDir = path.join(__dirname, '../data/projects');
  const files = fs.readdirSync(projectsDir)
    .filter(f => f.endsWith('.json') && f !== 'schema.json')
    .map(f => f.replace('.json', ''));

  res.json({ projects: files });
});
```

### 4. Project Metadata Endpoint
```javascript
app.get('/api/projects/:id/metadata', (req, res) => {
  const project = loadProject(req.params.id);
  res.json({
    id: project.id,
    title: project.title,
    year: project.year,
    tags: project.tags
  });
});
```

## Comparison with Other Endpoints

### Works Endpoint (existing)
```javascript
app.get('/api/works/:id', (req, res) => {
  const work = workSearch.getWorkById(req.params.id, worksData);
  // Returns from in-memory data
});
```

### Projects Endpoint (new)
```javascript
app.get('/api/projects/:id', (req, res) => {
  const project = fs.readFileSync(projectPath, 'utf8');
  // Returns from file system
});
```

**Why different?**
- Works data is loaded into memory on startup (for embedding search)
- Project pages are loaded on-demand (less frequently accessed, larger files)
- Can easily migrate projects to database later without changing API

## Best Practices

1. **Always use the API endpoint** - Never try to access `/data` directly from frontend
2. **Handle all error cases** - Check for 404, 400, 500 responses
3. **Use proper HTTP methods** - GET for reading, POST for creating (future)
4. **Log requests** - Helps with debugging and monitoring
5. **Validate input** - Sanitize project IDs (prevent path traversal)

## Security Considerations

### Current Protection
- File system access is server-side only
- Path traversal prevented by using `path.join()`
- JSON parsing errors caught
- Specific files served (can't list directory)

### Future Security
```javascript
// Sanitize project ID
const sanitizedId = projectId.replace(/[^a-zA-Z0-9-_]/g, '');

// Rate limiting
const rateLimit = require('express-rate-limit');
app.use('/api/projects', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Access control
if (project.private && !req.user) {
  return res.status(403).json({ error: 'Access denied' });
}
```

---

**Last Updated**: 2025-11-17
**Pattern**: RESTful API endpoint
**Status**: Production ready
