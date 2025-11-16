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

