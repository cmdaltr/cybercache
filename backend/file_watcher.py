import os
import time
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import mimetypes
from database import Database

class ContentWatcher(FileSystemEventHandler):
    """Watches a directory for new files and automatically adds them to the database"""

    def __init__(self, db, watched_dirs):
        self.db = db
        self.watched_dirs = watched_dirs
        self.supported_extensions = {
            '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp',
            '.mp4', '.webm', '.doc', '.docx', '.txt', '.md'
        }

    def get_category_from_path(self, file_path):
        """Determine category based on directory structure"""
        path_parts = Path(file_path).parts

        # Category mapping based on directory names
        category_mapping = {
            'posters': 'Posters',
            'cheatsheets': 'Cheat Sheets',
            'publications': 'Publications',
            'media': 'Media & Socials',
            'training': 'Training',
            'tooling': 'Tooling',
            'projects': 'Projects',
            'vms': 'Virtual Machines',
            'blue': 'Blue Team',
            'red': 'Red Team',
            'intelligence': 'Threat Intelligence',
            'int': 'Threat Intelligence',
        }

        for part in path_parts:
            part_lower = part.lower()
            if part_lower in category_mapping:
                return category_mapping[part_lower]

        return 'Uncategorized'

    def extract_title_from_filename(self, file_path):
        """Extract a clean title from filename"""
        filename = Path(file_path).stem
        # Replace underscores and hyphens with spaces
        title = filename.replace('_', ' ').replace('-', ' ')
        # Capitalize words
        title = ' '.join(word.capitalize() for word in title.split())
        return title

    def should_process_file(self, file_path):
        """Check if file should be processed"""
        ext = Path(file_path).suffix.lower()
        return ext in self.supported_extensions

    def on_created(self, event):
        """Called when a file is created"""
        if event.is_directory:
            return

        file_path = event.src_path

        if not self.should_process_file(file_path):
            return

        # Wait a moment to ensure file is completely written
        time.sleep(0.5)

        self.add_file_to_database(file_path)

    def on_modified(self, event):
        """Called when a file is modified"""
        if event.is_directory:
            return

        file_path = event.src_path

        if not self.should_process_file(file_path):
            return

        # Check if file already exists in database and update it
        # For now, we'll just log it
        print(f"File modified: {file_path}")

    def add_file_to_database(self, file_path):
        """Add a file to the database"""
        try:
            path = Path(file_path)

            if not path.exists():
                return

            title = self.extract_title_from_filename(file_path)
            category = self.get_category_from_path(file_path)
            file_type = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
            file_size = path.stat().st_size

            # Make file_path relative to project root for portability
            try:
                relative_path = path.relative_to(Path.cwd())
                file_path_str = str(relative_path)
            except ValueError:
                file_path_str = str(path)

            resource_id = self.db.add_resource(
                title=title,
                description=f'Auto-imported from {path.name}',
                file_path=file_path_str,
                file_type=file_type,
                file_size=file_size,
                category=category,
                tags='',
                resource_type='file'
            )

            if resource_id:
                print(f"✓ Added to database: {title} (ID: {resource_id})")
            else:
                print(f"⚠ File already exists in database: {title}")

        except Exception as e:
            print(f"✗ Error adding file to database: {e}")

def start_watcher(watched_dirs, db):
    """Start watching directories for changes"""
    event_handler = ContentWatcher(db, watched_dirs)
    observer = Observer()

    for directory in watched_dirs:
        if os.path.exists(directory):
            observer.schedule(event_handler, directory, recursive=True)
            print(f"📁 Watching directory: {directory}")
        else:
            print(f"⚠ Directory not found: {directory}")

    observer.start()
    return observer

def scan_existing_files(watched_dirs, db):
    """Scan existing files in watched directories and add them to database"""
    print("🔍 Scanning existing files...")

    watcher = ContentWatcher(db, watched_dirs)
    count = 0

    for directory in watched_dirs:
        if not os.path.exists(directory):
            continue

        for root, dirs, files in os.walk(directory):
            for file in files:
                file_path = os.path.join(root, file)
                if watcher.should_process_file(file_path):
                    watcher.add_file_to_database(file_path)
                    count += 1

    print(f"✓ Scanned {count} files")
