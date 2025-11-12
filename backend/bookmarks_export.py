"""
Bookmark export functionality for multiple browsers.
Generates bookmarks in formats compatible with Chrome, Firefox, Safari, and Edge.
"""

import json
from datetime import datetime
from html import escape
from database import Database


class BookmarkExporter:
    """Export resources as browser bookmarks"""

    def __init__(self, db: Database):
        self.db = db

    def export_html(self, browser='chrome'):
        """
        Export bookmarks as HTML (Netscape Bookmark File Format)
        Compatible with Chrome, Firefox, Safari, and Edge
        """
        resources = self.db.get_all_resources()

        # Group resources by category
        by_category = {}
        for resource in resources:
            category = resource.get('category', 'Uncategorized')
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(resource)

        # Generate HTML
        timestamp = int(datetime.now().timestamp())

        html = f'''<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>CyberCache Bookmarks</TITLE>
<H1>CyberCache Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="{timestamp}" LAST_MODIFIED="{timestamp}" PERSONAL_TOOLBAR_FOLDER="true">CyberCache</H3>
    <DL><p>
'''

        # Add bookmarks by category
        for category, items in sorted(by_category.items()):
            if not items:
                continue

            html += f'        <DT><H3 ADD_DATE="{timestamp}" LAST_MODIFIED="{timestamp}">{escape(category)}</H3>\n'
            html += '        <DL><p>\n'

            for item in items:
                url = self._get_resource_url(item)
                if url:
                    title = escape(item.get('title', 'Untitled'))
                    tags = item.get('tags', '')
                    html += f'            <DT><A HREF="{escape(url)}" ADD_DATE="{timestamp}" TAGS="{escape(tags)}">{title}</A>\n'
                    if item.get('description'):
                        html += f'            <DD>{escape(item["description"])}\n'

            html += '        </DL><p>\n'

        html += '''    </DL><p>
</DL><p>
'''

        return html

    def export_json_chrome(self):
        """Export as Chrome JSON format"""
        resources = self.db.get_all_resources()
        timestamp = int(datetime.now().timestamp() * 1000000)  # Chrome uses microseconds

        # Group by category
        by_category = {}
        for resource in resources:
            category = resource.get('category', 'Uncategorized')
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(resource)

        # Build folder structure
        folders = []
        for category, items in sorted(by_category.items()):
            folder_children = []
            for item in items:
                url = self._get_resource_url(item)
                if url:
                    folder_children.append({
                        "date_added": str(timestamp),
                        "guid": self._generate_guid(item['id']),
                        "id": str(item['id']),
                        "name": item.get('title', 'Untitled'),
                        "type": "url",
                        "url": url
                    })

            if folder_children:
                folders.append({
                    "date_added": str(timestamp),
                    "date_modified": str(timestamp),
                    "guid": self._generate_guid(f"folder_{category}"),
                    "id": str(len(folders) + 1000),
                    "name": category,
                    "type": "folder",
                    "children": folder_children
                })

        # Chrome bookmark JSON structure
        bookmark_json = {
            "checksum": "",
            "roots": {
                "bookmark_bar": {
                    "children": [{
                        "date_added": str(timestamp),
                        "date_modified": str(timestamp),
                        "guid": self._generate_guid("oscybershop"),
                        "id": "1",
                        "name": "CyberCache",
                        "type": "folder",
                        "children": folders
                    }],
                    "date_added": str(timestamp),
                    "date_modified": str(timestamp),
                    "guid": "bookmark_bar",
                    "id": "1",
                    "name": "Bookmarks Bar",
                    "type": "folder"
                },
                "other": {
                    "children": [],
                    "date_added": str(timestamp),
                    "date_modified": str(timestamp),
                    "guid": "other_bookmarks",
                    "id": "2",
                    "name": "Other Bookmarks",
                    "type": "folder"
                },
                "synced": {
                    "children": [],
                    "date_added": str(timestamp),
                    "date_modified": str(timestamp),
                    "guid": "synced_bookmarks",
                    "id": "3",
                    "name": "Mobile Bookmarks",
                    "type": "folder"
                }
            },
            "version": 1
        }

        return json.dumps(bookmark_json, indent=2)

    def export_json_firefox(self):
        """Export as Firefox JSON format"""
        resources = self.db.get_all_resources()
        timestamp = int(datetime.now().timestamp() * 1000000)  # Firefox uses microseconds

        # Group by category
        by_category = {}
        for resource in resources:
            category = resource.get('category', 'Uncategorized')
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(resource)

        # Build folder structure
        folders = []
        for category, items in sorted(by_category.items()):
            folder_children = []
            for item in items:
                url = self._get_resource_url(item)
                if url:
                    folder_children.append({
                        "dateAdded": timestamp,
                        "guid": self._generate_guid(item['id']),
                        "id": item['id'],
                        "index": len(folder_children),
                        "lastModified": timestamp,
                        "title": item.get('title', 'Untitled'),
                        "type": "text/x-moz-place",
                        "uri": url
                    })

            if folder_children:
                folders.append({
                    "children": folder_children,
                    "dateAdded": timestamp,
                    "guid": self._generate_guid(f"folder_{category}"),
                    "id": len(folders) + 1000,
                    "index": len(folders),
                    "lastModified": timestamp,
                    "root": "bookmarksMenuFolder",
                    "title": category,
                    "type": "text/x-moz-place-container"
                })

        # Firefox bookmark JSON structure
        bookmark_json = {
            "children": [{
                "children": folders,
                "dateAdded": timestamp,
                "guid": self._generate_guid("oscybershop"),
                "id": 1,
                "index": 0,
                "lastModified": timestamp,
                "root": "bookmarksMenuFolder",
                "title": "CyberCache",
                "type": "text/x-moz-place-container"
            }],
            "dateAdded": timestamp,
            "guid": "root________",
            "id": 1,
            "lastModified": timestamp,
            "root": "placesRoot",
            "title": "",
            "type": "text/x-moz-place-container"
        }

        return json.dumps(bookmark_json, indent=2)

    def _get_resource_url(self, resource):
        """Get URL for a resource (external URL or localhost path)"""
        # If it's an external link, return the URL
        if resource.get('url'):
            return resource['url']

        # If it's a file, return localhost path
        if resource.get('resource_type') == 'file' and resource.get('id'):
            return f"http://localhost:3000/resource/{resource['id']}"

        return None

    def _generate_guid(self, seed):
        """Generate a GUID-like string from seed"""
        import hashlib
        hash_obj = hashlib.md5(str(seed).encode())
        hex_str = hash_obj.hexdigest()
        # Format as GUID-like string
        return f"{hex_str[:8]}-{hex_str[8:12]}-{hex_str[12:16]}-{hex_str[16:20]}-{hex_str[20:32]}"


def export_bookmarks(db, format='html', browser='chrome'):
    """
    Export bookmarks in specified format

    Args:
        db: Database instance
        format: 'html' or 'json'
        browser: 'chrome', 'firefox', 'safari', or 'edge'

    Returns:
        Bookmark data as string
    """
    exporter = BookmarkExporter(db)

    if format == 'json':
        if browser == 'firefox':
            return exporter.export_json_firefox()
        else:
            # Chrome, Edge, and Safari all use similar JSON formats
            return exporter.export_json_chrome()
    else:
        # HTML format works for all browsers
        return exporter.export_html(browser)
