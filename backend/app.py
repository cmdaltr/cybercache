from flask import Flask, request, jsonify, send_from_directory, send_file, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from pathlib import Path
import mimetypes
import threading
import io

from database import Database
from file_watcher import start_watcher, scan_existing_files
from classifier import get_classifier
from bookmarks_export import export_bookmarks
from security import InputValidator, apply_security_headers

app = Flask(__name__)
CORS(app)

# Apply security headers to all responses
@app.after_request
def add_security_headers(response):
    return apply_security_headers(response)

# Configuration
UPLOAD_FOLDER = Path(__file__).parent.parent / 'uploads'
CONTENT_FOLDER = Path(__file__).parent.parent / 'content'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm', 'doc', 'docx', 'txt', 'md'}

UPLOAD_FOLDER.mkdir(exist_ok=True)
CONTENT_FOLDER.mkdir(exist_ok=True)

app.config['UPLOAD_FOLDER'] = str(UPLOAD_FOLDER)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Initialize database
db = Database()

# Watched directories for auto-import
WATCHED_DIRS = [
    str(CONTENT_FOLDER),
    str(UPLOAD_FOLDER),
]

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ============================================================================
# API Routes
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'CyberCache API is running'})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get database statistics"""
    stats = db.get_stats()
    return jsonify(stats)

# ============================================================================
# Resources API
# ============================================================================

@app.route('/api/resources', methods=['GET'])
def get_resources():
    """Get all resources with optional filtering"""
    category = request.args.get('category')
    resource_type = request.args.get('type')
    limit = request.args.get('limit', type=int)
    offset = request.args.get('offset', 0, type=int)

    resources = db.get_all_resources(
        category=category,
        resource_type=resource_type,
        limit=limit,
        offset=offset
    )

    return jsonify(resources)

@app.route('/api/resources/<int:resource_id>', methods=['GET'])
def get_resource(resource_id):
    """Get a single resource by ID"""
    resource = db.get_resource(resource_id)

    if not resource:
        return jsonify({'error': 'Resource not found'}), 404

    return jsonify(resource)

@app.route('/api/resources', methods=['POST'])
def create_resource():
    """Create a new resource (link or metadata) with input validation"""
    data = request.json

    required_fields = ['title', 'resource_type']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        # Validate and sanitize all inputs
        title = InputValidator.validate_title(data['title'])
        description = InputValidator.validate_description(data.get('description', ''))
        category = InputValidator.validate_category(data.get('category', ''))
        tags = InputValidator.validate_tags(data.get('tags', ''))
        url = InputValidator.validate_url(data.get('url', ''))
        resource_type = InputValidator.validate_resource_type(data['resource_type'])

        resource_id = db.add_resource(
            title=title,
            description=description,
            file_path=data.get('file_path'),  # Already validated during upload
            file_type=data.get('file_type'),
            file_size=data.get('file_size', 0),
            category=category,
            tags=tags,
            url=url,
            resource_type=resource_type,
            thumbnail_path=data.get('thumbnail_path')
        )

        if resource_id:
            return jsonify({'id': resource_id, 'message': 'Resource created successfully'}), 201
        else:
            return jsonify({'error': 'Resource already exists or could not be created'}), 400

    except ValueError as e:
        return jsonify({'error': f'Validation error: {str(e)}'}), 400
    except Exception as e:
        print(f"Error creating resource: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/resources/<int:resource_id>', methods=['PUT'])
def update_resource(resource_id):
    """Update a resource"""
    data = request.json

    success = db.update_resource(resource_id, **data)

    if success:
        return jsonify({'message': 'Resource updated successfully'})
    else:
        return jsonify({'error': 'Resource not found'}), 404

@app.route('/api/resources/<int:resource_id>', methods=['DELETE'])
def delete_resource(resource_id):
    """Delete a resource"""
    # Get resource to delete associated files
    resource = db.get_resource(resource_id)

    if not resource:
        return jsonify({'error': 'Resource not found'}), 404

    # Delete from database
    success = db.delete_resource(resource_id)

    if success:
        # Optionally delete file (only if in uploads folder)
        if resource.get('file_path'):
            file_path = Path(resource['file_path'])
            if file_path.exists() and str(UPLOAD_FOLDER) in str(file_path):
                try:
                    file_path.unlink()
                except Exception as e:
                    print(f"Error deleting file: {e}")

        return jsonify({'message': 'Resource deleted successfully'})
    else:
        return jsonify({'error': 'Could not delete resource'}), 500

# ============================================================================
# Upload API
# ============================================================================

@app.route('/api/extract/link', methods=['POST'])
def extract_link_metadata():
    """Extract metadata from a URL for preview before saving"""
    data = request.json

    if not data or 'url' not in data:
        return jsonify({'error': 'No URL provided'}), 400

    url = data['url']

    try:
        # Validate URL
        validated_url = InputValidator.validate_url(url)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    # Check if URL already exists
    existing = db.find_by_url(url)
    is_duplicate = existing is not None

    # Extract metadata and classify
    classifier = get_classifier()
    result = classifier.process_url_for_import(validated_url)

    # Convert tags list to comma-separated string
    tags = result.get('tags', [])
    if isinstance(tags, list):
        tags = ', '.join(tags)

    return jsonify({
        'url': validated_url,
        'title': result.get('title', ''),
        'description': result.get('description', ''),
        'category': result.get('category', ''),
        'tags': tags,
        'confidence': result.get('confidence', 'low'),
        'classifier': result.get('classifier', 'keywords'),
        'is_duplicate': is_duplicate,
        'missing_fields': [
            field for field, value in [
                ('title', result.get('title')),
                ('category', result.get('category')),
            ] if not value
        ]
    })

@app.route('/api/extract/file', methods=['POST'])
def extract_file_metadata():
    """Extract metadata from an uploaded file for preview before saving"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        InputValidator.validate_file_extension(file.filename)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    # Sanitize filename
    try:
        filename = InputValidator.sanitize_filename(file.filename)
    except ValueError as e:
        return jsonify({'error': f'Invalid filename: {str(e)}'}), 400

    file_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'

    # Generate title from filename
    title = Path(filename).stem.replace('_', ' ').replace('-', ' ')
    title = ' '.join(word.capitalize() for word in title.split())

    # Read file for classification (limit size for preview)
    file_data = file.read()
    file_size = len(file_data)

    # Classify based on file content
    classifier = get_classifier()

    # Save temporarily for PDF text extraction if needed
    temp_path = None
    classification = {'category': '', 'tags': [], 'confidence': 'low', 'classifier': 'keywords'}

    if file_type == 'application/pdf':
        temp_path = UPLOAD_FOLDER / f"temp_{filename}"
        try:
            with open(temp_path, 'wb') as f:
                f.write(file_data)
            classification = classifier.classify_file(str(temp_path), title, '')
        finally:
            if temp_path and temp_path.exists():
                temp_path.unlink()
    else:
        # For non-PDF files, classify based on filename/title
        classification = classifier.classify(title=title, filename=filename)

    # Convert tags list to comma-separated string
    tags = classification.get('tags', [])
    if isinstance(tags, list):
        tags = ', '.join(tags)

    # Seek back to beginning so file can be read again if needed
    file.seek(0)

    return jsonify({
        'filename': filename,
        'title': title,
        'description': '',  # Can't extract description from most files
        'category': classification.get('category', ''),
        'tags': tags,
        'file_type': file_type,
        'file_size': file_size,
        'confidence': classification.get('confidence', 'low'),
        'classifier': classification.get('classifier', 'keywords'),
        'missing_fields': [
            field for field, value in [
                ('title', title),
                ('category', classification.get('category')),
            ] if not value
        ]
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload a file with AI classification, database storage, and security validation"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        # Validate file extension for security
        InputValidator.validate_file_extension(file.filename)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    # Get and validate metadata from form
    try:
        title = request.form.get('title', '')
        description = InputValidator.validate_description(request.form.get('description', ''))
        category = InputValidator.validate_category(request.form.get('category', ''))
        tags = InputValidator.validate_tags(request.form.get('tags', ''))
        auto_classify = request.form.get('auto_classify', 'true').lower() == 'true'
    except ValueError as e:
        return jsonify({'error': f'Validation error: {str(e)}'}), 400

    # Read file data with size limit check
    file_data = file.read()
    file_size = len(file_data)

    # Additional size check (belt and suspenders)
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    if file_size > MAX_FILE_SIZE:
        return jsonify({'error': f'File too large. Maximum size is {MAX_FILE_SIZE / 1024 / 1024}MB'}), 400

    # Sanitize filename
    try:
        filename = InputValidator.sanitize_filename(file.filename)
    except ValueError as e:
        return jsonify({'error': f'Invalid filename: {str(e)}'}), 400

    file_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'

    # If no title provided, use filename
    if not title:
        title = Path(filename).stem.replace('_', ' ').replace('-', ' ')
        title = ' '.join(word.capitalize() for word in title.split())

    # Validate title
    try:
        title = InputValidator.validate_title(title)
    except ValueError as e:
        return jsonify({'error': f'Invalid title: {str(e)}'}), 400

    # AI Classification (if enabled and no category/tags provided)
    classifier_used = None
    classification_confidence = None

    if auto_classify and (not category or not tags):
        print(f"🤖 Classifying resource: {title}")

        # Save temporarily for PDF text extraction if needed
        temp_path = None
        if file_type == 'application/pdf':
            temp_path = UPLOAD_FOLDER / f"temp_{filename}"
            with open(temp_path, 'wb') as f:
                f.write(file_data)

        try:
            classifier = get_classifier()
            if temp_path:
                classification = classifier.classify_file(str(temp_path), title, description)
            else:
                classification = classifier.classify(title, description, '', filename)

            # Use AI suggestions if not provided by user
            if not category and classification.get('category'):
                category = classification['category']
            if not tags and classification.get('tags'):
                tags = classification['tags']

            classifier_used = classification.get('classifier', 'keywords')
            classification_confidence = classification.get('confidence', 'medium')

            print(f"✓ Classified as: {category} (tags: {tags}) using {classifier_used}")

        except Exception as e:
            print(f"⚠ Classification failed: {e}")
        finally:
            if temp_path and temp_path.exists():
                temp_path.unlink()

    # Convert tags list to string if needed
    if isinstance(tags, list):
        tags = ', '.join(tags)

    # Store file in database (not on disk)
    resource_id = db.add_resource(
        title=title,
        description=description,
        file_path=filename,  # Store original filename for reference
        file_data=file_data,  # Store actual file in database
        file_type=file_type,
        file_size=file_size,
        category=category,
        tags=tags,
        resource_type='file',
        classifier_used=classifier_used,
        classification_confidence=classification_confidence
    )

    if not resource_id:
        return jsonify({'error': 'File already exists (duplicate hash)'}), 400

    return jsonify({
        'message': 'File uploaded successfully',
        'filename': filename,
        'resource_id': resource_id,
        'category': category,
        'tags': tags,
        'classified_by': classifier_used
    }), 201

# ============================================================================
# Bulk Import API
# ============================================================================

@app.route('/api/upload/batch', methods=['POST'])
def upload_batch_files():
    """Upload multiple files at once (for directory upload)"""
    if 'files[]' not in request.files:
        return jsonify({'error': 'No files provided'}), 400

    files = request.files.getlist('files[]')

    if not files or len(files) == 0:
        return jsonify({'error': 'No files selected'}), 400

    auto_classify = request.form.get('auto_classify', 'true').lower() == 'true'

    results = {
        'processed': [],
        'failed': [],
        'duplicates': []
    }

    classifier = get_classifier()

    for file in files:
        if file.filename == '':
            continue

        # Validate file extension
        try:
            InputValidator.validate_file_extension(file.filename)
        except ValueError as e:
            results['failed'].append({
                'filename': file.filename,
                'reason': str(e)
            })
            continue

        if not allowed_file(file.filename):
            results['failed'].append({
                'filename': file.filename,
                'reason': 'File type not allowed'
            })
            continue

        try:
            # Sanitize filename
            filename = InputValidator.sanitize_filename(file.filename)
            file_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'

            # Read file data
            file_data = file.read()
            file_size = len(file_data)

            # Check size limit
            MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
            if file_size > MAX_FILE_SIZE:
                results['failed'].append({
                    'filename': filename,
                    'reason': f'File too large (max {MAX_FILE_SIZE / 1024 / 1024}MB)'
                })
                continue

            # Generate title from filename
            title = Path(filename).stem.replace('_', ' ').replace('-', ' ')
            title = ' '.join(word.capitalize() for word in title.split())

            # Classification
            category = ''
            tags = ''
            classifier_used = None
            classification_confidence = None

            if auto_classify:
                temp_path = None
                if file_type == 'application/pdf':
                    temp_path = UPLOAD_FOLDER / f"temp_{filename}"
                    with open(temp_path, 'wb') as f:
                        f.write(file_data)

                try:
                    if temp_path:
                        classification = classifier.classify_file(str(temp_path), title, '')
                    else:
                        classification = classifier.classify(title, '', '', filename)

                    category = classification.get('category', '')
                    tags = classification.get('tags', [])
                    if isinstance(tags, list):
                        tags = ', '.join(tags)
                    classifier_used = classification.get('classifier', 'keywords')
                    classification_confidence = classification.get('confidence', 'medium')
                except Exception as e:
                    print(f"Classification failed for {filename}: {e}")
                finally:
                    if temp_path and temp_path.exists():
                        temp_path.unlink()

            # Store file in database
            resource_id = db.add_resource(
                title=title,
                description='',
                file_path=filename,
                file_data=file_data,
                file_type=file_type,
                file_size=file_size,
                category=category,
                tags=tags,
                resource_type='file',
                classifier_used=classifier_used,
                classification_confidence=classification_confidence
            )

            if resource_id:
                results['processed'].append({
                    'id': resource_id,
                    'filename': filename,
                    'title': title,
                    'category': category,
                    'tags': tags
                })
            else:
                results['duplicates'].append({
                    'filename': filename,
                    'reason': 'File already exists (duplicate hash)'
                })

        except Exception as e:
            print(f"Error processing {file.filename}: {e}")
            results['failed'].append({
                'filename': file.filename,
                'reason': str(e)
            })

    return jsonify({
        'message': f"Processed {len(results['processed'])} files",
        'total_submitted': len(files),
        'successful': len(results['processed']),
        'duplicates': len(results['duplicates']),
        'failed': len(results['failed']),
        'results': results
    })


@app.route('/api/extract/batch', methods=['POST'])
def extract_batch_metadata():
    """Extract metadata from multiple files for preview before saving"""
    if 'files[]' not in request.files:
        return jsonify({'error': 'No files provided'}), 400

    files = request.files.getlist('files[]')

    if not files or len(files) == 0:
        return jsonify({'error': 'No files selected'}), 400

    classifier = get_classifier()
    previews = []

    for file in files:
        if file.filename == '':
            continue

        # Validate file extension
        try:
            InputValidator.validate_file_extension(file.filename)
        except ValueError as e:
            previews.append({
                'filename': file.filename,
                'error': str(e)
            })
            continue

        if not allowed_file(file.filename):
            previews.append({
                'filename': file.filename,
                'error': 'File type not allowed'
            })
            continue

        try:
            filename = InputValidator.sanitize_filename(file.filename)
            file_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'

            # Generate title from filename
            title = Path(filename).stem.replace('_', ' ').replace('-', ' ')
            title = ' '.join(word.capitalize() for word in title.split())

            # Read file for classification
            file_data = file.read()
            file_size = len(file_data)

            # Classify
            temp_path = None
            classification = {'category': '', 'tags': [], 'confidence': 'low', 'classifier': 'keywords'}

            if file_type == 'application/pdf':
                temp_path = UPLOAD_FOLDER / f"temp_{filename}"
                try:
                    with open(temp_path, 'wb') as f:
                        f.write(file_data)
                    classification = classifier.classify_file(str(temp_path), title, '')
                finally:
                    if temp_path and temp_path.exists():
                        temp_path.unlink()
            else:
                classification = classifier.classify(title=title, filename=filename)

            tags = classification.get('tags', [])
            if isinstance(tags, list):
                tags = ', '.join(tags)

            # Reset file pointer
            file.seek(0)

            previews.append({
                'filename': filename,
                'title': title,
                'description': '',
                'category': classification.get('category', ''),
                'tags': tags,
                'file_type': file_type,
                'file_size': file_size,
                'confidence': classification.get('confidence', 'low'),
                'classifier': classification.get('classifier', 'keywords')
            })

        except Exception as e:
            previews.append({
                'filename': file.filename,
                'error': str(e)
            })

    return jsonify({
        'total': len(previews),
        'previews': previews
    })


@app.route('/api/import/links', methods=['POST'])
def bulk_import_links():
    """
    Import multiple links from a text file or list.
    Automatically fetches titles, descriptions, categories, and tags.
    """
    data = request.json

    if not data or 'links' not in data:
        return jsonify({'error': 'No links provided'}), 400

    links = data['links']
    if isinstance(links, str):
        # Parse text content - one URL per line
        links = [line.strip() for line in links.split('\n') if line.strip()]

    # Filter valid URLs
    valid_links = []
    for link in links:
        link = link.strip()
        if link and (link.startswith('http://') or link.startswith('https://')):
            valid_links.append(link)

    if not valid_links:
        return jsonify({'error': 'No valid URLs found'}), 400

    # Process each link
    classifier = get_classifier()
    results = {
        'processed': [],
        'failed': [],
        'duplicates': []
    }

    for url in valid_links:
        try:
            # Check if URL already exists
            existing = db.find_by_url(url)
            if existing:
                results['duplicates'].append({'url': url, 'reason': 'Already exists'})
                continue

            # Process URL - fetch metadata and classify
            processed = classifier.process_url_for_import(url)

            # Convert tags list to string
            tags = processed.get('tags', [])
            if isinstance(tags, list):
                tags = ', '.join(tags)

            # Validate inputs
            try:
                title = InputValidator.validate_title(processed.get('title', url))
                description = InputValidator.validate_description(processed.get('description', ''))
                category = InputValidator.validate_category(processed.get('category', ''))
                tags = InputValidator.validate_tags(tags)
                validated_url = InputValidator.validate_url(url)
            except ValueError as e:
                results['failed'].append({'url': url, 'reason': str(e)})
                continue

            # Add to database
            resource_id = db.add_resource(
                title=title,
                description=description,
                category=category,
                tags=tags,
                url=validated_url,
                resource_type='link',
                classifier_used=processed.get('classifier'),
                classification_confidence=processed.get('confidence')
            )

            if resource_id:
                results['processed'].append({
                    'id': resource_id,
                    'url': url,
                    'title': title,
                    'category': category,
                    'tags': tags
                })
            else:
                results['duplicates'].append({'url': url, 'reason': 'Could not add (possible duplicate)'})

        except Exception as e:
            print(f"Error processing {url}: {e}")
            results['failed'].append({'url': url, 'reason': str(e)})

    return jsonify({
        'message': f"Processed {len(results['processed'])} links",
        'total_submitted': len(valid_links),
        'successful': len(results['processed']),
        'duplicates': len(results['duplicates']),
        'failed': len(results['failed']),
        'results': results
    })

@app.route('/api/import/links/preview', methods=['POST'])
def preview_bulk_import():
    """
    Preview what will be imported without actually saving.
    Returns extracted metadata and classifications for each URL.
    """
    data = request.json

    if not data or 'links' not in data:
        return jsonify({'error': 'No links provided'}), 400

    links = data['links']
    if isinstance(links, str):
        links = [line.strip() for line in links.split('\n') if line.strip()]

    valid_links = []
    for link in links:
        link = link.strip()
        if link and (link.startswith('http://') or link.startswith('https://')):
            valid_links.append(link)

    if not valid_links:
        return jsonify({'error': 'No valid URLs found'}), 400

    classifier = get_classifier()
    previews = []

    for url in valid_links:
        try:
            # Check if already exists
            existing = db.find_by_url(url)
            is_duplicate = existing is not None

            # Process URL
            processed = classifier.process_url_for_import(url)

            previews.append({
                'url': url,
                'title': processed.get('title', ''),
                'description': processed.get('description', ''),
                'category': processed.get('category', ''),
                'tags': processed.get('tags', []),
                'confidence': processed.get('confidence', 'low'),
                'is_duplicate': is_duplicate
            })
        except Exception as e:
            previews.append({
                'url': url,
                'error': str(e),
                'is_duplicate': False
            })

    return jsonify({
        'total': len(valid_links),
        'previews': previews
    })

# ============================================================================
# Search API
# ============================================================================

@app.route('/api/search', methods=['GET'])
def search():
    """Search resources with input validation"""
    query = request.args.get('q', '')
    category = request.args.get('category', '')
    limit = request.args.get('limit', 50, type=int)

    if not query:
        return jsonify({'error': 'No search query provided'}), 400

    try:
        # Sanitize search query
        query = InputValidator.sanitize_string(query, max_length=500)

        # Validate category if provided
        if category:
            category = InputValidator.validate_category(category)

        # Validate limit
        limit = InputValidator.validate_integer(limit, min_val=1, max_val=1000)

        results = db.search_resources(query, category=category, limit=limit)

        return jsonify(results)

    except ValueError as e:
        return jsonify({'error': f'Validation error: {str(e)}'}), 400

# ============================================================================
# Categories API
# ============================================================================

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all categories"""
    categories = db.get_categories()
    return jsonify(categories)

@app.route('/api/tags', methods=['GET'])
def get_tags():
    """Get all unique tags"""
    tags = db.get_all_tags()
    return jsonify(tags)

# ============================================================================
# Bookmarks Export API
# ============================================================================

@app.route('/api/bookmarks/export/<browser>', methods=['GET'])
def export_bookmarks_endpoint(browser):
    """Export bookmarks for specified browser"""
    supported_browsers = ['chrome', 'firefox', 'safari', 'edge', 'opera']

    if browser.lower() not in supported_browsers:
        return jsonify({'error': f'Unsupported browser. Choose from: {", ".join(supported_browsers)}'}), 400

    format_type = request.args.get('format', 'html')  # 'html' or 'json'

    try:
        bookmark_data = export_bookmarks(db, format=format_type, browser=browser.lower())

        # Determine file extension and content type
        if format_type == 'json':
            ext = 'json'
            content_type = 'application/json'
        else:
            ext = 'html'
            content_type = 'text/html'

        filename = f'cybercache_bookmarks_{browser}.{ext}'

        return Response(
            bookmark_data,
            mimetype=content_type,
            headers={
                'Content-Disposition': f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        return jsonify({'error': f'Failed to export bookmarks: {str(e)}'}), 500

# ============================================================================
# File Serving
# ============================================================================

@app.route('/files/<path:filepath>')
def serve_file(filepath):
    """Serve files from database or legacy disk storage"""
    # First, try to find by filename in database
    resources = db.get_all_resources()
    for resource in resources:
        if resource.get('file_path') == filepath or resource.get('file_path', '').endswith(filepath):
            # Get file data from database
            file_data_result = db.get_file_data(resource['id'])
            if file_data_result and file_data_result.get('file_data'):
                # Stream from database
                return Response(
                    io.BytesIO(file_data_result['file_data']),
                    mimetype=file_data_result.get('file_type', 'application/octet-stream'),
                    headers={
                        'Content-Disposition': f'inline; filename="{file_data_result.get("title", "file")}"'
                    }
                )

    # Fallback: Try legacy disk storage (for backward compatibility during migration)
    file_path = CONTENT_FOLDER / filepath
    if file_path.exists():
        return send_file(file_path)

    return jsonify({'error': 'File not found'}), 404

@app.route('/files/id/<int:resource_id>')
def serve_file_by_id(resource_id):
    """Serve file by resource ID (more efficient than path lookup)"""
    file_data_result = db.get_file_data(resource_id)

    if not file_data_result or not file_data_result.get('file_data'):
        return jsonify({'error': 'File not found'}), 404

    return Response(
        io.BytesIO(file_data_result['file_data']),
        mimetype=file_data_result.get('file_type', 'application/octet-stream'),
        headers={
            'Content-Disposition': f'inline; filename="{file_data_result.get("title", "file")}"'
        }
    )

# ============================================================================
# Initialization
# ============================================================================

def initialize_app():
    """Initialize the application"""
    print("🚀 Initializing CyberCache...")

    # Scan existing files on startup
    scan_existing_files(WATCHED_DIRS, db)

    # Start file watcher in background thread
    observer = start_watcher(WATCHED_DIRS, db)

    print("✓ Initialization complete")
    print(f"📊 Database stats: {db.get_stats()}")

    return observer

# ============================================================================
# Main
# ============================================================================

if __name__ == '__main__':
    observer = initialize_app()

    try:
        print("\n" + "="*60)
        print("🗄️  CyberCache API Server")
        print("="*60)
        print(f"📍 Running on: http://localhost:22244")
        print(f"📁 Watching directories:")
        for d in WATCHED_DIRS:
            print(f"   - {d}")
        print("="*60 + "\n")

        app.run(debug=True, host='0.0.0.0', port=22244, use_reloader=False)
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
        observer.stop()
        observer.join()
