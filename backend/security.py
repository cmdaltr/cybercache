"""
Security utilities for input validation and sanitization
"""

import re
from html import escape
from urllib.parse import urlparse
from pathlib import Path


class InputValidator:
    """Validates and sanitizes user inputs"""

    # Maximum lengths for various fields
    MAX_TITLE_LENGTH = 500
    MAX_DESCRIPTION_LENGTH = 5000
    MAX_TAG_LENGTH = 1000
    MAX_URL_LENGTH = 2000

    # Allowed URL schemes
    ALLOWED_URL_SCHEMES = {'http', 'https', 'ftp', 'sftp'}

    # Dangerous file extensions
    DANGEROUS_EXTENSIONS = {
        '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
        '.jar', '.msi', '.app', '.deb', '.rpm', '.dmg', '.pkg', '.sh',
        '.ps1', '.psm1', '.psd1', '.reg', '.dll', '.so', '.dylib'
    }

    # Allowed file extensions for uploads
    ALLOWED_EXTENSIONS = {
        '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp',
        '.mp4', '.webm', '.doc', '.docx', '.txt', '.md',
        '.csv', '.json', '.xml', '.zip', '.tar', '.gz'
    }

    @staticmethod
    def sanitize_string(value, max_length=None, allow_html=False):
        """
        Sanitize a string input

        Args:
            value: Input string
            max_length: Maximum allowed length
            allow_html: If False, escape HTML characters

        Returns:
            Sanitized string
        """
        if not isinstance(value, str):
            value = str(value)

        # Strip leading/trailing whitespace
        value = value.strip()

        # Escape HTML if not allowed
        if not allow_html:
            value = escape(value)

        # Enforce maximum length
        if max_length and len(value) > max_length:
            value = value[:max_length]

        return value

    @classmethod
    def validate_title(cls, title):
        """Validate resource title"""
        if not title or not isinstance(title, str):
            raise ValueError("Title is required and must be a string")

        title = cls.sanitize_string(title, cls.MAX_TITLE_LENGTH)

        if len(title) < 1:
            raise ValueError("Title cannot be empty")

        return title

    @classmethod
    def validate_description(cls, description):
        """Validate resource description"""
        if description is None:
            return ""

        return cls.sanitize_string(description, cls.MAX_DESCRIPTION_LENGTH)

    @classmethod
    def validate_url(cls, url):
        """
        Validate URL input

        Args:
            url: URL string to validate

        Returns:
            Validated URL

        Raises:
            ValueError: If URL is invalid or potentially dangerous
        """
        if not url:
            return ""

        url = cls.sanitize_string(url, cls.MAX_URL_LENGTH)

        try:
            parsed = urlparse(url)

            # Check scheme is allowed
            if parsed.scheme and parsed.scheme.lower() not in cls.ALLOWED_URL_SCHEMES:
                raise ValueError(f"URL scheme '{parsed.scheme}' not allowed")

            # Check for common dangerous patterns
            dangerous_patterns = [
                'javascript:',
                'data:',
                'vbscript:',
                'file:',
            ]

            url_lower = url.lower()
            for pattern in dangerous_patterns:
                if pattern in url_lower:
                    raise ValueError(f"Potentially dangerous URL pattern detected: {pattern}")

            return url

        except Exception as e:
            raise ValueError(f"Invalid URL: {str(e)}")

    @classmethod
    def validate_tags(cls, tags):
        """
        Validate tags input

        Args:
            tags: String or list of tags

        Returns:
            Sanitized tags string
        """
        if not tags:
            return ""

        # Convert list to string if needed
        if isinstance(tags, list):
            tags = ', '.join(str(tag) for tag in tags)

        tags = cls.sanitize_string(tags, cls.MAX_TAG_LENGTH)

        # Remove any potentially dangerous characters
        tags = re.sub(r'[<>{}\\]', '', tags)

        return tags

    @classmethod
    def validate_category(cls, category):
        """Validate category input"""
        if not category:
            return ""

        category = cls.sanitize_string(category, 200)

        # Only allow alphanumeric, spaces, and common punctuation
        if not re.match(r'^[a-zA-Z0-9\s\-_&]+$', category):
            raise ValueError("Category contains invalid characters")

        return category

    @classmethod
    def validate_file_extension(cls, filename):
        """
        Validate file extension

        Args:
            filename: Name of the file

        Returns:
            True if extension is allowed

        Raises:
            ValueError: If extension is dangerous or not allowed
        """
        if not filename:
            raise ValueError("Filename is required")

        ext = Path(filename).suffix.lower()

        # Check for dangerous extensions
        if ext in cls.DANGEROUS_EXTENSIONS:
            raise ValueError(f"File extension '{ext}' is not allowed for security reasons")

        # Check if extension is in allowed list
        if ext not in cls.ALLOWED_EXTENSIONS:
            raise ValueError(f"File extension '{ext}' is not supported")

        return True

    @classmethod
    def validate_resource_type(cls, resource_type):
        """Validate resource type"""
        allowed_types = {'file', 'link'}

        if resource_type not in allowed_types:
            raise ValueError(f"Resource type must be one of: {', '.join(allowed_types)}")

        return resource_type

    @classmethod
    def sanitize_filename(cls, filename):
        """
        Sanitize filename to prevent path traversal and other attacks

        Args:
            filename: Original filename

        Returns:
            Sanitized filename
        """
        if not filename:
            raise ValueError("Filename is required")

        # Get just the basename (no directory components)
        filename = Path(filename).name

        # Remove or replace dangerous characters
        # Allow: alphanumeric, dash, underscore, period
        filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)

        # Prevent hidden files
        if filename.startswith('.'):
            filename = '_' + filename[1:]

        # Prevent empty filename
        if not filename or filename == '.':
            raise ValueError("Invalid filename")

        # Limit length
        if len(filename) > 255:
            name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
            filename = name[:250] + (f'.{ext}' if ext else '')

        return filename

    @classmethod
    def validate_integer(cls, value, min_val=None, max_val=None):
        """Validate integer input"""
        try:
            value = int(value)
        except (TypeError, ValueError):
            raise ValueError("Value must be an integer")

        if min_val is not None and value < min_val:
            raise ValueError(f"Value must be at least {min_val}")

        if max_val is not None and value > max_val:
            raise ValueError(f"Value must be at most {max_val}")

        return value


class SecurityHeaders:
    """Security headers for HTTP responses"""

    @staticmethod
    def get_secure_headers():
        """Return dictionary of secure HTTP headers"""
        return {
            # Prevent MIME type sniffing
            'X-Content-Type-Options': 'nosniff',

            # Enable XSS protection
            'X-XSS-Protection': '1; mode=block',

            # Prevent clickjacking
            'X-Frame-Options': 'SAMEORIGIN',

            # Strict transport security (if using HTTPS)
            # 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

            # Content security policy
            'Content-Security-Policy': (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: blob:; "
                "font-src 'self' data:;"
            ),

            # Referrer policy
            'Referrer-Policy': 'strict-origin-when-cross-origin',

            # Permissions policy
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        }


def apply_security_headers(response):
    """
    Apply security headers to Flask response

    Args:
        response: Flask response object

    Returns:
        Response with security headers added
    """
    headers = SecurityHeaders.get_secure_headers()
    for header, value in headers.items():
        response.headers[header] = value
    return response
