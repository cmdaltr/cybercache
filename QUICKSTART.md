# CyberCache - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### 1. Install Dependencies (First Time Only)

Run the setup script:
```bash
./setup.sh
```

Or manually:
```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 2. Start the Servers

You need TWO terminal windows:

**Terminal 1 - Backend:**
```bash
./run_backend.sh
```
Or manually:
```bash
cd backend
source venv/bin/activate
python app.py
```

**Terminal 2 - Frontend:**
```bash
./run_frontend.sh
```
Or manually:
```bash
cd frontend
npm run dev
```

### 3. Open Your Browser

Navigate to: **http://localhost:3000**

## ✨ What's New in v2.0

### 🔄 Automatic File Detection
- Drop files into `content/` or `uploads/` folders
- Files are automatically detected and added to the database
- No manual HTML editing required!

### 🔍 Powerful Search
- Full-text search with SQLite FTS5
- Search across titles, descriptions, tags, and categories
- Results ranked by relevance

### 📤 Web-Based Upload
- Upload files through the web interface
- Add external links and resources
- Organize with categories and tags

### 🎨 Modern UI
- Smooth React-based interface
- Responsive design (mobile-friendly)
- Dark theme optimized for security professionals
- Smooth animations and transitions

### 📊 Dynamic Content
- All content managed through SQLite database
- Zero code duplication
- RESTful API for all operations

## 📁 Directory Structure

```
cybercache/
├── backend/          # Python Flask API
├── frontend/         # React web app
├── content/          # Drop files here for auto-import
├── uploads/          # User uploaded files
└── main/content/     # Legacy content (still supported)
```

## 🎯 Common Tasks

### Add Files Automatically
Just copy files to the watched directories:
```bash
cp my-cheatsheet.pdf content/cheatsheets/
# File will automatically appear in the app!
```

### Upload Files via Web
1. Click **Upload** in the navigation
2. Choose **Upload File** or **Add Link**
3. Fill in details (title, category, tags)
4. Submit!

### Search for Resources
1. Click **Search** in the navigation
2. Type your query
3. Press Enter or click Search
4. Results appear instantly

### Browse by Category
1. Click **Browse** in the navigation
2. Use category filters to narrow down
3. Click any resource to view details

## 🔧 Configuration

### Watched Directories
Edit `backend/app.py`:
```python
WATCHED_DIRS = [
    str(CONTENT_FOLDER),
    str(UPLOAD_FOLDER),
    # Add your own directories here
]
```

### Categories
Default categories are automatically created:
- Posters
- Cheat Sheets
- Publications
- Media & Socials
- Training
- Tooling
- Projects
- Virtual Machines
- Blue Team
- Red Team
- Threat Intelligence

Add more in `backend/database.py` → `default_categories`

### File Types
Supported extensions (edit in `backend/app.py`):
```python
ALLOWED_EXTENSIONS = {
    'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp',
    'mp4', 'webm', 'doc', 'docx', 'txt', 'md'
}
```

## 🐛 Troubleshooting

### "Port already in use"
Change ports:
- Backend: Edit `port=5000` in `backend/app.py`
- Frontend: Edit `server.port` in `frontend/vite.config.js`

### Files not importing automatically
1. Check file extension is supported
2. Verify file is in a watched directory
3. Check backend terminal for errors
4. Restart backend server

### Search not working
- SQLite FTS5 is required (SQLite 3.9.0+)
- Check backend terminal for errors
- Restart backend to rebuild index

### Database issues
Reset the database:
```bash
cd backend
rm oscybershop.db
python app.py  # Will recreate database
```

## 📚 More Information

See **README.new.md** for complete documentation including:
- Architecture details
- API documentation
- Production deployment
- Advanced configuration
- Development guide

## 🎉 Enjoy!

You now have a fully functional, modern resource management system. Start adding your cybersecurity resources and take advantage of the automatic organization and powerful search!
