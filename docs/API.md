## 📝 API Documentation

The backend exposes a RESTful API on **http://localhost:22244**

---

## Health Check

### `GET /api/health`

Check if the API server is running.

**Example Request:**
```bash
curl http://localhost:22244/api/health
```

**Example Response:**
```json
{
  "status": "ok",
  "message": "CyberCache API is running"
}
```

---

## Resources

### `GET /api/resources`

Get all resources with optional filtering.

**Query Parameters:**
- `category` (optional) - Filter by category
- `type` (optional) - Filter by resource type (file, link)
- `limit` (optional) - Limit number of results
- `offset` (optional) - Offset for pagination (default: 0)

**Example Request:**
```bash
# Get all resources
curl http://localhost:22244/api/resources

# Get resources from specific category
curl http://localhost:22244/api/resources?category=security

# Get only file resources with pagination
curl http://localhost:22244/api/resources?type=file&limit=10&offset=0
```

**Example Response:**
```json
[
  {
    "id": 1,
    "title": "OWASP Top 10",
    "description": "Web application security risks",
    "file_path": "owasp-top-10.pdf",
    "file_type": "application/pdf",
    "file_size": 2048576,
    "category": "security",
    "tags": "web, security, owasp",
    "url": null,
    "resource_type": "file",
    "created_at": "2025-11-16T10:30:00",
    "updated_at": "2025-11-16T10:30:00"
  },
  {
    "id": 2,
    "title": "HackerOne Platform",
    "description": "Bug bounty platform",
    "file_path": null,
    "file_type": null,
    "file_size": 0,
    "category": "bug-bounty",
    "tags": "platform, bounty",
    "url": "https://hackerone.com",
    "resource_type": "link",
    "created_at": "2025-11-16T11:00:00",
    "updated_at": "2025-11-16T11:00:00"
  }
]
```

---

### `GET /api/resources/:id`

Get a single resource by ID.

**Example Request:**
```bash
curl http://localhost:22244/api/resources/1
```

**Example Response:**
```json
{
  "id": 1,
  "title": "OWASP Top 10",
  "description": "Web application security risks",
  "file_path": "owasp-top-10.pdf",
  "file_type": "application/pdf",
  "file_size": 2048576,
  "category": "security",
  "tags": "web, security, owasp",
  "url": null,
  "resource_type": "file",
  "created_at": "2025-11-16T10:30:00",
  "updated_at": "2025-11-16T10:30:00"
}
```

**Error Response:**
```json
{
  "error": "Resource not found"
}
```

---

### `POST /api/resources`

Create a new resource (link or metadata).

**Request Body:**
```json
{
  "title": "Metasploit Framework",
  "description": "Penetration testing framework",
  "category": "tools",
  "tags": "penetration-testing, framework, ruby",
  "url": "https://www.metasploit.com",
  "resource_type": "link"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:22244/api/resources \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Metasploit Framework",
    "description": "Penetration testing framework",
    "category": "tools",
    "tags": "penetration-testing, framework",
    "url": "https://www.metasploit.com",
    "resource_type": "link"
  }'
```

**Example Response:**
```json
{
  "id": 3,
  "message": "Resource created successfully"
}
```

**Error Response:**
```json
{
  "error": "Missing required fields"
}
```

---

### `PUT /api/resources/:id`

Update an existing resource.

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "category": "new-category",
  "tags": "new, tags"
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:22244/api/resources/1 \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description for OWASP Top 10",
    "tags": "web, security, owasp, 2024"
  }'
```

**Example Response:**
```json
{
  "message": "Resource updated successfully"
}
```

**Error Response:**
```json
{
  "error": "Resource not found"
}
```

---

### `DELETE /api/resources/:id`

Delete a resource and its associated file (if stored in uploads folder).

**Example Request:**
```bash
curl -X DELETE http://localhost:22244/api/resources/1
```

**Example Response:**
```json
{
  "message": "Resource deleted successfully"
}
```

**Error Response:**
```json
{
  "error": "Resource not found"
}
```

---

## Search

### `GET /api/search`

Search resources by title, description, tags, or category.

**Query Parameters:**
- `q` (required) - Search query
- `category` (optional) - Filter by category
- `limit` (optional) - Limit results (default: 50, max: 1000)

**Example Request:**
```bash
# Simple search
curl http://localhost:22244/api/search?q=security

# Search within category
curl http://localhost:22244/api/search?q=pentesting&category=tools

# Limit results
curl http://localhost:22244/api/search?q=web&limit=10
```

**Example Response:**
```json
[
  {
    "id": 1,
    "title": "OWASP Top 10",
    "description": "Web application security risks",
    "category": "security",
    "tags": "web, security, owasp",
    "resource_type": "file",
    "relevance_score": 0.95
  },
  {
    "id": 4,
    "title": "Web Security Academy",
    "description": "Free online security training",
    "category": "training",
    "tags": "web, security, learning",
    "resource_type": "link",
    "relevance_score": 0.87
  }
]
```

---

## Categories

### `GET /api/categories`

Get all unique categories with resource counts.

**Example Request:**
```bash
curl http://localhost:22244/api/categories
```

**Example Response:**
```json
[
  {
    "category": "security",
    "count": 15
  },
  {
    "category": "tools",
    "count": 23
  },
  {
    "category": "bug-bounty",
    "count": 8
  },
  {
    "category": "training",
    "count": 12
  }
]
```

---

## Upload

### `POST /api/upload`

Upload a file with automatic AI classification.

**Request:** `multipart/form-data`

**Form Fields:**
- `file` (required) - The file to upload
- `title` (optional) - Resource title (defaults to filename)
- `description` (optional) - Resource description
- `category` (optional) - Manual category (skips AI if provided)
- `tags` (optional) - Manual tags (skips AI if provided)
- `auto_classify` (optional) - Enable AI classification (default: true)

**Allowed File Types:**
- Documents: pdf, doc, docx, txt, md
- Images: png, jpg, jpeg, gif, webp
- Videos: mp4, webm

**Max File Size:** 100MB

**Example Request:**
```bash
# Upload with AI classification
curl -X POST http://localhost:22244/api/upload \
  -F "file=@/path/to/burp-suite-guide.pdf" \
  -F "description=Comprehensive guide to using Burp Suite" \
  -F "auto_classify=true"

# Upload with manual metadata
curl -X POST http://localhost:22244/api/upload \
  -F "file=@/path/to/nmap-cheatsheet.pdf" \
  -F "title=Nmap Cheat Sheet" \
  -F "category=tools" \
  -F "tags=nmap, scanning, network" \
  -F "auto_classify=false"
```

**Example Response:**
```json
{
  "message": "File uploaded successfully",
  "filename": "burp-suite-guide.pdf",
  "resource_id": 5,
  "category": "tools",
  "tags": "burp-suite, web-security, proxy",
  "classified_by": "openai"
}
```

**Error Responses:**
```json
{
  "error": "No file provided"
}
```

```json
{
  "error": "File type not allowed"
}
```

```json
{
  "error": "File already exists (duplicate hash)"
}
```

---

## File Serving

### `GET /files/:filepath`

Serve a file by its filename/path.

**Example Request:**
```bash
curl http://localhost:22244/files/owasp-top-10.pdf > owasp.pdf
```

---

### `GET /files/id/:resource_id`

Serve a file by resource ID (recommended - more efficient).

**Example Request:**
```bash
curl http://localhost:22244/files/id/1 > file.pdf
```

**Response:** Binary file data with appropriate MIME type

---

## Statistics

### `GET /api/stats`

Get database and system statistics.

**Example Request:**
```bash
curl http://localhost:22244/api/stats
```

**Example Response:**
```json
{
  "total_resources": 58,
  "total_files": 34,
  "total_links": 24,
  "total_size_bytes": 157286400,
  "total_size_mb": 150.0,
  "categories": 12,
  "most_recent": {
    "id": 58,
    "title": "Latest Upload",
    "created_at": "2025-11-16T15:45:00"
  }
}
```

---

## Bookmarks Export

### `GET /api/bookmarks/export/:browser`

Export all link resources as browser bookmarks.

**Supported Browsers:**
- `chrome`
- `firefox`
- `safari`
- `edge`

**Query Parameters:**
- `format` (optional) - Export format: `html` (default) or `json`

**Example Request:**
```bash
# Export for Chrome (HTML)
curl http://localhost:22244/api/bookmarks/export/chrome > bookmarks.html

# Export as JSON
curl http://localhost:22244/api/bookmarks/export/firefox?format=json > bookmarks.json
```

**Example HTML Response:**
```html
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>CyberCache Bookmarks</H1>
<DL><p>
    <DT><H3>security</H3>
    <DL><p>
        <DT><A HREF="https://owasp.org">OWASP Foundation</A>
    </DL><p>
</DL><p>
```

---

## Batch Operations

### Uploading Multiple Files

#### Upload All Files in a Directory

To upload all files from a directory, you can use a bash loop:

**Example - Upload all files from a directory:**
```bash
# Upload all files in a directory
for file in /path/to/directory/*; do
  if [ -f "$file" ]; then
    echo "Uploading: $file"
    curl -X POST http://localhost:22244/api/upload \
      -F "file=@$file" \
      -F "auto_classify=true"
    echo ""
  fi
done
```

**Example - Upload specific file types (PDFs only):**
```bash
# Upload only PDF files
for file in /path/to/directory/*.pdf; do
  if [ -f "$file" ]; then
    echo "Uploading: $file"
    curl -X POST http://localhost:22244/api/upload \
      -F "file=@$file" \
      -F "auto_classify=true"
  fi
done
```

**Example - Upload with manual category:**
```bash
# Upload all files with a specific category
CATEGORY="security-research"
for file in /path/to/directory/*; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "Uploading: $filename to category: $CATEGORY"
    curl -X POST http://localhost:22244/api/upload \
      -F "file=@$file" \
      -F "category=$CATEGORY" \
      -F "auto_classify=true"
  fi
done
```

**Example - Recursive upload (including subdirectories):**
```bash
# Upload all files recursively from directory and subdirectories
find /path/to/directory -type f \( -name "*.pdf" -o -name "*.png" -o -name "*.jpg" -o -name "*.txt" \) | while read file; do
  echo "Uploading: $file"
  curl -X POST http://localhost:22244/api/upload \
    -F "file=@$file" \
    -F "auto_classify=true"
  echo ""
done
```

**Example - Upload with progress and error handling:**
```bash
#!/bin/bash
# upload_directory.sh - Upload all files from a directory with error handling

UPLOAD_DIR="/path/to/directory"
SUCCESSFUL=0
FAILED=0

for file in "$UPLOAD_DIR"/*; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "Uploading: $filename"

    response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:22244/api/upload \
      -F "file=@$file" \
      -F "auto_classify=true")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq 201 ]; then
      echo "✓ Success: $filename"
      ((SUCCESSFUL++))
    else
      echo "✗ Failed: $filename (HTTP $http_code)"
      echo "  Error: $body"
      ((FAILED++))
    fi
    echo ""
  fi
done

echo "======================================"
echo "Upload Summary"
echo "======================================"
echo "Successful: $SUCCESSFUL"
echo "Failed: $FAILED"
echo "Total: $((SUCCESSFUL + FAILED))"
```

#### Using the File Watcher (Automatic)

CyberCache automatically watches these directories for new files:
- `content/` - Place files here for automatic import
- `uploads/` - Files uploaded via API are stored here

**To use automatic file watching:**

1. Copy files to the watched directory:
```bash
cp /path/to/files/* /path/to/cybercache/content/
```

2. The file watcher will automatically detect and import them within a few seconds.

3. Check the backend logs to see the import progress:
```bash
tail -f logs/backend.log
```

**Example output:**
```
📁 New file detected: /path/to/cybercache/content/security-report.pdf
🤖 Classifying resource: Security Report
✓ Classified as: security (tags: report, analysis) using openai
✓ File imported: security-report.pdf (ID: 42)
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error, missing fields)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a JSON object with an `error` field:

```json
{
  "error": "Description of what went wrong"
}
```

