#!/usr/bin/env python3
"""
Migration script to move files from disk to database storage.
This script will:
1. Scan content/ directory for all files
2. Classify each file using AI
3. Store files as BLOBs in database
4. Delete original files from disk (optional)
"""

import os
import sys
from pathlib import Path
from database import Database
from classifier import get_classifier
import mimetypes

def migrate_files_to_database(content_dir='../content', delete_after_import=True, dry_run=False):
    """
    Migrate all files from content directory to database

    Args:
        content_dir: Path to content directory
        delete_after_import: If True, delete files from disk after successful import
        dry_run: If True, don't actually modify anything, just show what would happen
    """
    db = Database()
    classifier = get_classifier()

    content_path = Path(content_dir).resolve()

    if not content_path.exists():
        print(f"❌ Content directory not found: {content_path}")
        return

    print("="*70)
    print("📦 CyberCache - File to Database Migration")
    print("="*70)
    print(f"📁 Scanning: {content_path}")
    print(f"🗑️  Delete after import: {delete_after_import}")
    print(f"🧪 Dry run mode: {dry_run}")
    print("="*70)
    print()

    # Supported file extensions
    ALLOWED_EXTENSIONS = {'.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp',
                         '.mp4', '.webm', '.doc', '.docx', '.txt', '.md'}

    # Find all files
    all_files = []
    for root, dirs, files in os.walk(content_path):
        for file in files:
            file_path = Path(root) / file
            if file_path.suffix.lower() in ALLOWED_EXTENSIONS:
                all_files.append(file_path)

    print(f"✓ Found {len(all_files)} files to migrate\n")

    if not all_files:
        print("No files to migrate!")
        return

    # Statistics
    stats = {
        'total': len(all_files),
        'success': 0,
        'skipped': 0,
        'failed': 0,
        'deleted': 0,
        'classifiers': {'openai': 0, 'anthropic': 0, 'keywords': 0}
    }

    # Process each file
    for i, file_path in enumerate(all_files, 1):
        print(f"[{i}/{stats['total']}] Processing: {file_path.name}")

        try:
            # Generate title from filename
            title = file_path.stem.replace('_', ' ').replace('-', ' ')
            title = ' '.join(word.capitalize() for word in title.split())

            # Determine category from directory structure
            relative_path = file_path.relative_to(content_path)
            category_from_path = relative_path.parts[0] if len(relative_path.parts) > 1 else ''

            # Classify the file
            print(f"  🤖 Classifying...")
            classification = classifier.classify_file(
                str(file_path),
                title=title,
                description=f'Imported from {relative_path}'
            )

            category = classification.get('category') or category_from_path
            tags = classification.get('tags', [])
            classifier_used = classification.get('classifier', 'keywords')
            confidence = classification.get('confidence', 'medium')

            # Track classifier usage
            if classifier_used in stats['classifiers']:
                stats['classifiers'][classifier_used] += 1

            print(f"  ✓ Category: {category or 'Uncategorized'}")
            print(f"  ✓ Tags: {', '.join(tags) if tags else 'none'}")
            print(f"  ✓ Classifier: {classifier_used} ({confidence} confidence)")

            if dry_run:
                print(f"  [DRY RUN] Would import to database")
                stats['success'] += 1
                continue

            # Read file data
            with open(file_path, 'rb') as f:
                file_data = f.read()

            file_size = len(file_data)
            file_type = mimetypes.guess_type(str(file_path))[0] or 'application/octet-stream'

            # Add to database
            resource_id = db.add_resource(
                title=title,
                description=f'Migrated from {relative_path}',
                file_path=file_path.name,  # Store filename for reference
                file_data=file_data,  # Store actual file data
                file_type=file_type,
                file_size=file_size,
                category=category,
                tags=tags,
                resource_type='file',
                classifier_used=classifier_used,
                classification_confidence=confidence
            )

            if resource_id:
                print(f"  ✓ Imported to database (ID: {resource_id})")
                stats['success'] += 1

                # Delete original file if requested
                if delete_after_import:
                    try:
                        file_path.unlink()
                        print(f"  🗑️  Deleted from disk")
                        stats['deleted'] += 1
                    except Exception as e:
                        print(f"  ⚠️  Failed to delete: {e}")
            else:
                print(f"  ⚠️  Skipped (duplicate file)")
                stats['skipped'] += 1

        except Exception as e:
            print(f"  ❌ Failed: {e}")
            stats['failed'] += 1

        print()

    # Print summary
    print("="*70)
    print("📊 Migration Summary")
    print("="*70)
    print(f"Total files:       {stats['total']}")
    print(f"✓ Successfully imported: {stats['success']}")
    print(f"⚠️  Skipped (duplicates):  {stats['skipped']}")
    print(f"❌ Failed:                {stats['failed']}")
    if delete_after_import and not dry_run:
        print(f"🗑️  Deleted from disk:     {stats['deleted']}")
    print()
    print("Classifiers used:")
    for classifier_name, count in stats['classifiers'].items():
        if count > 0:
            print(f"  {classifier_name}: {count}")
    print("="*70)

    if dry_run:
        print("\n⚠️  This was a DRY RUN - no changes were made")
        print("Run with --execute to perform the actual migration")
    elif delete_after_import:
        print("\n✓ Migration complete! Files are now stored in the database.")
        print("  Original files have been deleted from disk.")
    else:
        print("\n✓ Migration complete! Files are now stored in the database.")
        print("  Original files remain on disk (use --delete to remove them)")

def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Migrate files from disk to database storage'
    )
    parser.add_argument(
        '--content-dir',
        default='../content',
        help='Path to content directory (default: ../content)'
    )
    parser.add_argument(
        '--delete',
        action='store_true',
        help='Delete files from disk after successful import'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be done without making changes'
    )
    parser.add_argument(
        '--execute',
        action='store_true',
        help='Actually perform the migration (default is dry run)'
    )
    parser.add_argument(
        '--yes',
        action='store_true',
        help='Skip confirmation prompt (use with caution!)'
    )

    args = parser.parse_args()

    # Default to dry run unless --execute is specified
    dry_run = not args.execute or args.dry_run

    if not dry_run and args.delete and not args.yes:
        print("⚠️  WARNING: This will DELETE files from disk after importing to database!")
        response = input("Are you sure you want to continue? (yes/no): ")
        if response.lower() != 'yes':
            print("Migration cancelled")
            return

    migrate_files_to_database(
        content_dir=args.content_dir,
        delete_after_import=args.delete,
        dry_run=dry_run
    )

if __name__ == '__main__':
    main()
