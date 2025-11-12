# CyberCache

A modern, dynamic, locally-hosted web application for managing and organizing your cybersecurity resources. Features automatic file detection, powerful search, and a smooth React-based UI.

## ✨ Features

- **🤖 AI Classification**: Automatic categorization into Blue Team/Red Team/Intelligence with multi-provider support
- **🔄 Automatic Content Updates**: Drop files into watched folders and they automatically appear
- **💾 Database Storage**: Files stored as BLOBs in SQLite for easy backup and management
- **📑 Bookmark Export**: Export for Chrome, Firefox, Safari, and Edge
- **🔍 Powerful Search**: Full-text search with SQLite FTS5 indexing (sub-50ms)
- **📤 File Upload**: Web-based interface with security validation
- **🔗 Link Management**: Add external URLs and resources to your collection
- **🎨 Modern UI**: Smooth, responsive React interface with Tailwind CSS
- **🔒 Secure**: Comprehensive input validation, XSS/SQL injection prevention, security headers
- **🐳 Docker Ready**: One-command deployment with Docker Compose
- **📱 Mobile-Friendly**: Fully responsive design works on all devices

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion
- **Backend**: Python 3.13 + Flask + SQLite
- **Search**: SQLite FTS5 (Full-Text Search)
- **File Watching**: Watchdog library for automatic file detection

### Directory Structure
```
cybercache/
├── backend/
│   ├── app.py              # Flask API server
│   ├── database.py         # SQLite database management
│   ├── file_watcher.py     # Automatic file detection
│   ├── requirements.txt    # Python dependencies
│   └── cybercache.db       # SQLite database (auto-created)
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page views
│   │   ├── api/            # API client
│   │   └── App.jsx         # Main app
│   ├── package.json        # Node dependencies
│   └── index.html          # HTML template
├── content/                # Watched folder for auto-import
├── uploads/                # User uploaded files
└── main/content/           # Legacy content (also watched)
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- npm or yarn

### Installation

1. **Install Backend Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

2. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

### Running the Application

#### Quick Start (Recommended)

Use the provided scripts to manage both servers with a single command:

```bash
# Start both servers
./scripts/start.sh

# Check status
./scripts/status.sh

# View logs
./scripts/logs.sh

# Restart both servers
./scripts/restart.sh

# Stop both servers
./scripts/stop.sh
```

The web app will be available at `http://localhost:3000` and the API at `http://localhost:5000`.

#### Manual Start (Alternative)

If you prefer to run servers manually in separate terminals:

**Terminal 1 - Backend Server:**
```bash
cd backend
source venv/bin/activate
python app.py
```

**Terminal 2 - Frontend Development Server:**
```bash
cd frontend
npm run dev
```

### First Time Setup

When you first start the application:
1. The backend will automatically create the SQLite database
2. Default categories will be populated
3. The file watcher will scan existing files in watched directories
4. Any files found will be automatically imported

## 📖 Usage

### Automatic File Import

Simply drop your files (PDFs, images, documents) into these watched directories:
- `content/` - Main content directory
- `uploads/` - User uploads directory
- `main/content/` - Legacy content (backward compatibility)

The file watcher will automatically detect new files and add them to the database. Files are automatically categorized based on their directory structure:
- `content/posters/` → Posters category
- `content/cheatsheets/` → Cheat Sheets category
- `content/publications/` → Publications category
- etc.

### Manual Upload

1. Navigate to the **Upload** page
2. Choose to upload a file or add a link
3. Fill in the metadata (title, description, category, tags)
4. Submit the form

### Searching

The search function uses full-text indexing for fast, accurate results:
- Search across titles, descriptions, tags, and categories
- Results are ranked by relevance
- Filter results by category
- Supports partial word matching

### Browsing

- View all resources or filter by category
- Click on any resource to view details
- Download files or visit external links
- Delete resources you no longer need

## 🔧 Configuration

### Watched Directories

Edit `backend/app.py` to customize watched directories:
```python
WATCHED_DIRS = [
    str(CONTENT_FOLDER),
    str(UPLOAD_FOLDER),
    # Add more directories here
]
```

### Allowed File Types

Edit `backend/app.py` to modify allowed file extensions:
```python
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'doc', 'docx', 'txt', 'md'}
```

### Categories

Categories are managed in the database. Default categories are automatically created on first run. You can modify them in `backend/database.py`:
```python
default_categories = [
    ('Category Name', 'slug', 'Description', 'icon-class'),
    # Add more categories here
]
```

## 🌐 Production Build

To create a production build:

1. **Build Frontend**
```bash
cd frontend
npm run build
```
This creates optimized static files in `frontend/dist/`

2. **Serve with Flask**

Update `backend/app.py` to serve the built frontend:
```python
from flask import send_from_directory

@app.route('/')
def serve_frontend():
    return send_from_directory('../frontend/dist', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend/dist', path)
```

3. **Run production server**
```bash
cd backend
python app.py
```

## 🔄 Migration from Old Version

Your existing content in `main/content/` is automatically detected and imported. The file watcher includes this directory by default for backward compatibility.

To migrate:
1. Start the new application
2. The backend will automatically scan and import existing files
3. Verify all content appears in the Browse page
4. Optionally organize files into category-specific subdirectories in `content/`

## 📝 API Documentation

The backend exposes a RESTful API:

### Resources
- `GET /api/resources` - Get all resources (with optional filters)
- `GET /api/resources/:id` - Get single resource
- `POST /api/resources` - Create new resource (link)
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource

### Search
- `GET /api/search?q=query` - Search resources

### Categories
- `GET /api/categories` - Get all categories

### Upload
- `POST /api/upload` - Upload file (multipart/form-data)

### Stats
- `GET /api/stats` - Get database statistics

### Health
- `GET /api/health` - Health check

## 🛠️ Development

### Frontend Development
```bash
cd frontend
npm run dev
```
Vite provides hot module replacement for instant updates.

### Backend Development
The Flask server runs with `debug=True` for auto-reloading on code changes.

### Adding New Features

1. **Backend**: Add routes in `backend/app.py` or create new files in `backend/api/`
2. **Frontend**: Create new components in `frontend/src/components/` or pages in `frontend/src/pages/`
3. **Database**: Modify schema in `backend/database.py`

## 🐛 Troubleshooting

### Database Issues
Delete `backend/cybercache.db` to reset the database. It will be recreated on next startup.

### File Not Importing
- Check file extension is in `ALLOWED_EXTENSIONS`
- Verify file is in a watched directory
- Check backend console for error messages

### Search Not Working
- Ensure SQLite version supports FTS5 (3.9.0+)
- Check for errors in backend console
- Try rebuilding the FTS index by restarting the backend

### Port Already in Use
Change ports in:
- Backend: `app.run(port=5000)` in `backend/app.py`
- Frontend: `server.port` in `frontend/vite.config.js`

## 📚 Documentation

### Getting Started
- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 3 steps
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Command cheat sheet

### Features
- **[NEW_FEATURES.md](NEW_FEATURES.md)** - AI classification, database storage, bookmarks
- **[COMPARISON.md](COMPARISON.md)** - v1 vs v2 comparison

### Deployment
- **[DOCKER.md](DOCKER.md)** - Docker deployment guide
- **[SECURITY.md](SECURITY.md)** - Security features and best practices

### Technical
- **[FINAL_SUMMARY.md](FINAL_SUMMARY.md)** - Complete transformation overview
- **[SECURITY_AND_DOCKER_SUMMARY.md](SECURITY_AND_DOCKER_SUMMARY.md)** - Security & Docker implementation

## 📄 License

Same as original OneStopCyberShop project.

## 🙏 Credits

Built on the foundation of the original OneStopCyberShop by improving architecture, adding dynamic features, and modernizing the tech stack.
