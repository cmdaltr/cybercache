import sqlite3
import json
from datetime import datetime
from pathlib import Path
import hashlib

class Database:
    def __init__(self, db_path=None):
        # Use environment variable if set, otherwise default
        import os
        self.db_path = db_path or os.getenv('DATABASE_PATH', 'cybercache.db')
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """Initialize database with tables and FTS5 search index"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # Main resources table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS resources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                file_path TEXT,
                file_data BLOB,
                file_type TEXT,
                file_size INTEGER,
                file_hash TEXT UNIQUE,
                category TEXT,
                tags TEXT,
                url TEXT,
                resource_type TEXT NOT NULL,
                thumbnail_path TEXT,
                classifier_used TEXT,
                classification_confidence TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Full-text search virtual table using FTS5
        cursor.execute('''
            CREATE VIRTUAL TABLE IF NOT EXISTS resources_fts USING fts5(
                title,
                description,
                tags,
                category,
                content='resources',
                content_rowid='id',
                tokenize='porter unicode61'
            )
        ''')

        # Triggers to keep FTS index in sync
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS resources_ai AFTER INSERT ON resources BEGIN
                INSERT INTO resources_fts(rowid, title, description, tags, category)
                VALUES (new.id, new.title, new.description, new.tags, new.category);
            END
        ''')

        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS resources_ad AFTER DELETE ON resources BEGIN
                DELETE FROM resources_fts WHERE rowid = old.id;
            END
        ''')

        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS resources_au AFTER UPDATE ON resources BEGIN
                UPDATE resources_fts SET
                    title = new.title,
                    description = new.description,
                    tags = new.tags,
                    category = new.category
                WHERE rowid = new.id;
            END
        ''')

        # Categories table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                description TEXT,
                icon TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Insert default categories
        default_categories = [
            ('Posters', 'posters', 'Visual reference materials', 'fa-image'),
            ('Cheat Sheets', 'cheatsheets', 'Technical reference documents', 'fa-file-text'),
            ('Publications', 'publications', 'Research papers and guides', 'fa-book'),
            ('Media & Socials', 'media', 'Video content and social profiles', 'fa-video-camera'),
            ('Training', 'training', 'Learning resources and challenges', 'fa-graduation-cap'),
            ('Tooling', 'tooling', 'Security tool collections', 'fa-wrench'),
            ('Projects', 'projects', 'Security frameworks and projects', 'fa-folder'),
            ('Virtual Machines', 'vms', 'VM resources', 'fa-desktop'),
            ('Blue Team', 'blue', 'Cyber Defence resources', 'fa-shield'),
            ('Red Team', 'red', 'Offensive Cyber resources', 'fa-bomb'),
            ('Threat Intelligence', 'intelligence', 'Threat intel resources', 'fa-eye'),
        ]

        cursor.executemany('''
            INSERT OR IGNORE INTO categories (name, slug, description, icon)
            VALUES (?, ?, ?, ?)
        ''', default_categories)

        conn.commit()
        conn.close()

    def add_resource(self, title, description='', file_path=None, file_data=None,
                     file_type=None, file_size=0, category='', tags='', url='',
                     resource_type='file', thumbnail_path=None, classifier_used=None,
                     classification_confidence=None):
        """Add a new resource to the database with optional file BLOB storage"""
        conn = self.get_connection()
        cursor = conn.cursor()

        file_hash = None

        # Read file data if file_path provided and file_data not provided
        if file_path and Path(file_path).exists() and file_data is None:
            with open(file_path, 'rb') as f:
                file_content = f.read()
                file_hash = hashlib.md5(file_content).hexdigest()
                file_data = file_content  # Store in database
        elif file_data:
            file_hash = hashlib.md5(file_data).hexdigest()

        # Convert tags list to comma-separated string if needed
        if isinstance(tags, list):
            tags = ', '.join(tags)

        try:
            cursor.execute('''
                INSERT INTO resources
                (title, description, file_path, file_data, file_type, file_size, file_hash,
                 category, tags, url, resource_type, thumbnail_path,
                 classifier_used, classification_confidence)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (title, description, file_path, file_data, file_type, file_size, file_hash,
                  category, tags, url, resource_type, thumbnail_path,
                  classifier_used, classification_confidence))

            resource_id = cursor.lastrowid
            conn.commit()
            return resource_id
        except sqlite3.IntegrityError:
            # Resource with same hash already exists
            return None
        finally:
            conn.close()

    def get_resource(self, resource_id, include_file_data=False):
        """Get a single resource by ID (excludes BLOB data by default for performance)"""
        conn = self.get_connection()
        cursor = conn.cursor()

        if include_file_data:
            cursor.execute('SELECT * FROM resources WHERE id = ?', (resource_id,))
        else:
            # Exclude large BLOB data for list views
            cursor.execute('''
                SELECT id, title, description, file_path, file_type, file_size, file_hash,
                       category, tags, url, resource_type, thumbnail_path,
                       classifier_used, classification_confidence, created_at, updated_at
                FROM resources WHERE id = ?
            ''', (resource_id,))

        resource = cursor.fetchone()
        conn.close()
        return dict(resource) if resource else None

    def get_file_data(self, resource_id):
        """Get only the file BLOB data for a resource"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT file_data, file_type, title FROM resources WHERE id = ?', (resource_id,))
        result = cursor.fetchone()
        conn.close()
        return dict(result) if result else None

    def get_all_resources(self, category=None, resource_type=None, limit=None, offset=0):
        """Get all resources with optional filtering (excludes BLOB data for performance)"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # Exclude file_data BLOB for list views
        query = '''SELECT id, title, description, file_path, file_type, file_size, file_hash,
                          category, tags, url, resource_type, thumbnail_path,
                          classifier_used, classification_confidence, created_at, updated_at
                   FROM resources WHERE 1=1'''
        params = []

        if category:
            query += ' AND category = ?'
            params.append(category)

        if resource_type:
            query += ' AND resource_type = ?'
            params.append(resource_type)

        query += ' ORDER BY created_at DESC'

        if limit:
            query += ' LIMIT ? OFFSET ?'
            params.extend([limit, offset])

        cursor.execute(query, params)
        resources = cursor.fetchall()
        conn.close()

        return [dict(row) for row in resources]

    def search_resources(self, query, category=None, limit=50):
        """Full-text search across resources"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # FTS5 MATCH query
        search_query = '''
            SELECT r.*, rank
            FROM resources r
            JOIN resources_fts ON r.id = resources_fts.rowid
            WHERE resources_fts MATCH ?
        '''
        params = [query]

        if category:
            search_query += ' AND r.category = ?'
            params.append(category)

        search_query += ' ORDER BY rank LIMIT ?'
        params.append(limit)

        cursor.execute(search_query, params)
        results = cursor.fetchall()
        conn.close()

        return [dict(row) for row in results]

    def update_resource(self, resource_id, **kwargs):
        """Update a resource"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # Build dynamic update query
        fields = []
        values = []
        for key, value in kwargs.items():
            if key != 'id':
                fields.append(f'{key} = ?')
                values.append(value)

        if not fields:
            return False

        values.append(datetime.now().isoformat())
        values.append(resource_id)

        query = f"UPDATE resources SET {', '.join(fields)}, updated_at = ? WHERE id = ?"
        cursor.execute(query, values)
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()

        return success

    def delete_resource(self, resource_id):
        """Delete a resource"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM resources WHERE id = ?', (resource_id,))
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()

        return success

    def get_categories(self):
        """Get all categories"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM categories ORDER BY name')
        categories = cursor.fetchall()
        conn.close()

        return [dict(row) for row in categories]

    def get_stats(self):
        """Get database statistics"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT COUNT(*) as total FROM resources')
        total = cursor.fetchone()['total']

        cursor.execute('SELECT category, COUNT(*) as count FROM resources GROUP BY category')
        by_category = {row['category']: row['count'] for row in cursor.fetchall()}

        cursor.execute('SELECT resource_type, COUNT(*) as count FROM resources GROUP BY resource_type')
        by_type = {row['resource_type']: row['count'] for row in cursor.fetchall()}

        conn.close()

        return {
            'total': total,
            'by_category': by_category,
            'by_type': by_type
        }
