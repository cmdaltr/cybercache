# CyberCache

A modern, dynamic, locally-hosted web application for managing and organizing your cybersecurity resources. Features automatic file detection, powerful search, and a smooth React-based UI.

## 🚀 Quick Start

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- npm or yarn

### Two Simple Commands

**1. First Time Setup (install dependencies):**
```bash
./setup
```

**2. Start the Application:**
```bash
./start
```

That's it! Open your browser to **http://localhost:3000**


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

### What Happens Automatically

When you run `./start`, the application will:
1. Start both backend (port 5000) and frontend (port 3000) servers
2. Run them in the background with automatic logging
3. Create the SQLite database if it doesn't exist
4. Populate default categories
5. Watch for new files in the `content/` directory

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
