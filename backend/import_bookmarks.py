#!/usr/bin/env python3
"""
Import bookmarks from HTML file into CyberCache database
"""

import sys
import re
from pathlib import Path
from html.parser import HTMLParser
from database import Database

class BookmarkParser(HTMLParser):
    """Parse Netscape-style bookmark HTML files"""

    def __init__(self):
        super().__init__()
        self.bookmarks = []
        self.current_folder = []
        self.in_dt = False
        self.pending_link = None

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag == 'h3':
            # Folder heading
            self.in_h3 = True
            self.current_h3_text = ''
        elif tag == 'a':
            # Bookmark link
            href = attrs_dict.get('HREF', attrs_dict.get('href', ''))
            if href:
                self.pending_link = {
                    'url': href,
                    'title': '',
                    'category': '/'.join(self.current_folder) if self.current_folder else 'Bookmarks'
                }
        elif tag == 'dl':
            # Entering a subfolder
            if hasattr(self, 'current_h3_text') and self.current_h3_text:
                self.current_folder.append(self.current_h3_text)
                self.current_h3_text = ''

    def handle_endtag(self, tag):
        if tag == 'h3':
            self.in_h3 = False
        elif tag == 'dl':
            # Leaving a subfolder
            if self.current_folder:
                self.current_folder.pop()
        elif tag == 'a':
            # End of link
            if self.pending_link:
                self.bookmarks.append(self.pending_link)
                self.pending_link = None

    def handle_data(self, data):
        data = data.strip()
        if not data:
            return

        if hasattr(self, 'in_h3') and self.in_h3:
            self.current_h3_text = data
        elif self.pending_link:
            self.pending_link['title'] = data

def import_bookmarks(html_file_path, db):
    """Import bookmarks from HTML file into database"""

    print(f"📚 Importing bookmarks from: {html_file_path}")

    # Read the HTML file
    with open(html_file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Parse bookmarks
    parser = BookmarkParser()
    parser.feed(html_content)

    print(f"📊 Found {len(parser.bookmarks)} bookmarks")

    # Import into database
    imported = 0
    skipped = 0
    failed = 0

    for bookmark in parser.bookmarks:
        try:
            # Clean up category
            category = bookmark['category'].strip('/')
            if not category:
                category = 'Bookmarks'

            # Add to database
            resource_id = db.add_resource(
                title=bookmark['title'] or bookmark['url'],
                description=f"Imported from bookmarks: {category}",
                url=bookmark['url'],
                category=category,
                tags='bookmark, imported',
                resource_type='link'
            )

            if resource_id:
                imported += 1
                if imported % 10 == 0:
                    print(f"  ✓ Imported {imported} bookmarks...")
            else:
                skipped += 1

        except Exception as e:
            failed += 1
            print(f"  ✗ Failed to import '{bookmark['title']}': {e}")

    print(f"\n{'='*50}")
    print(f"📊 Import Summary")
    print(f"{'='*50}")
    print(f"✅ Successfully imported: {imported}")
    print(f"⏭️  Skipped (duplicates):  {skipped}")
    print(f"❌ Failed:                {failed}")
    print(f"📝 Total processed:       {len(parser.bookmarks)}")
    print(f"{'='*50}\n")

    return imported, skipped, failed

def main():
    """Main entry point"""

    # Get the project root directory
    script_dir = Path(__file__).parent
    project_dir = script_dir.parent

    # Default bookmark file location
    default_bookmark_file = project_dir / 'content' / 'Bookmarks.html'

    # Allow custom file path via command line
    if len(sys.argv) > 1:
        bookmark_file = Path(sys.argv[1])
    else:
        bookmark_file = default_bookmark_file

    if not bookmark_file.exists():
        print(f"❌ Bookmark file not found: {bookmark_file}")
        print(f"\nUsage: python3 import_bookmarks.py [bookmark_file.html]")
        print(f"Default: {default_bookmark_file}")
        sys.exit(1)

    # Initialize database
    db = Database()

    # Import bookmarks
    try:
        import_bookmarks(bookmark_file, db)
        print("✅ Bookmark import complete!")
    except Exception as e:
        print(f"❌ Error during import: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
