#!/usr/bin/env python3
"""
Reset Attendance History Script for Face Attendance System
This script clears all attendance records from the database.
Useful for Docker deployments or when starting fresh.
"""

import os
import sys
import logging
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import argparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "faceattend")
ATTENDANCE_COLLECTION = "attendance"

def connect_to_database():
    """Connect to MongoDB database"""
    try:
        client = MongoClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000
        )
        
        # Test connection
        client.admin.command('ping')
        db = client[DATABASE_NAME]
        
        logger.info(f"✅ Connected to MongoDB: {DATABASE_NAME}")
        return client, db
        
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        return None, None
    except Exception as e:
        logger.error(f"❌ Database connection error: {e}")
        return None, None

def get_attendance_stats(db):
    """Get current attendance statistics"""
    try:
        total_records = db[ATTENDANCE_COLLECTION].count_documents({})
        
        if total_records > 0:
            # Get date range
            oldest = db[ATTENDANCE_COLLECTION].find().sort("timestamp", 1).limit(1)
            newest = db[ATTENDANCE_COLLECTION].find().sort("timestamp", -1).limit(1)
            
            oldest_record = list(oldest)[0] if oldest else None
            newest_record = list(newest)[0] if newest else None
            
            return {
                "total": total_records,
                "oldest": oldest_record["timestamp"] if oldest_record else None,
                "newest": newest_record["timestamp"] if newest_record else None
            }
        else:
            return {"total": 0, "oldest": None, "newest": None}
            
    except Exception as e:
        logger.error(f"❌ Error getting stats: {e}")
        return {"total": 0, "oldest": None, "newest": None}

def reset_attendance_history(db, confirm=False):
    """Reset (delete) all attendance history"""
    try:
        # Get current stats
        stats = get_attendance_stats(db)
        
        if stats["total"] == 0:
            logger.info("📭 No attendance records found. Nothing to reset.")
            return True
        
        logger.info(f"📊 Current attendance records: {stats['total']}")
        if stats["oldest"] and stats["newest"]:
            logger.info(f"📅 Date range: {stats['oldest']} to {stats['newest']}")
        
        if not confirm:
            logger.warning("⚠️ This will DELETE ALL attendance records permanently!")
            response = input("Are you sure you want to continue? (yes/no): ").lower().strip()
            if response not in ['yes', 'y']:
                logger.info("❌ Operation cancelled by user")
                return False
        
        # Delete all attendance records
        result = db[ATTENDANCE_COLLECTION].delete_many({})
        
        if result.deleted_count > 0:
            logger.info(f"✅ Successfully deleted {result.deleted_count} attendance records")
            
            # Also delete attendance images from GridFS if they exist
            try:
                import gridfs
                fs = gridfs.GridFS(db)
                
                # Find and delete attendance images
                attendance_files = fs.find({"image_type": "attendance"})
                deleted_files = 0
                
                for file in attendance_files:
                    fs.delete(file._id)
                    deleted_files += 1
                
                if deleted_files > 0:
                    logger.info(f"✅ Successfully deleted {deleted_files} attendance images")
                else:
                    logger.info("📭 No attendance images found to delete")
                    
            except Exception as e:
                logger.warning(f"⚠️ Could not delete attendance images: {e}")
            
            return True
        else:
            logger.warning("⚠️ No records were deleted")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error resetting attendance history: {e}")
        return False

def backup_attendance_history(db, backup_file=None):
    """Create a backup of attendance history before reset"""
    try:
        if backup_file is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = f"attendance_backup_{timestamp}.json"
        
        import json
        from bson import json_util
        
        # Get all attendance records
        records = list(db[ATTENDANCE_COLLECTION].find({}))
        
        if not records:
            logger.info("📭 No attendance records to backup")
            return True
        
        # Convert to JSON and save
        with open(backup_file, 'w') as f:
            json.dump(records, f, default=json_util.default, indent=2)
        
        logger.info(f"✅ Backup created: {backup_file} ({len(records)} records)")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error creating backup: {e}")
        return False

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Reset Face Attendance System History")
    parser.add_argument("--confirm", action="store_true", help="Skip confirmation prompt")
    parser.add_argument("--backup", action="store_true", help="Create backup before reset")
    parser.add_argument("--backup-file", type=str, help="Custom backup filename")
    parser.add_argument("--stats-only", action="store_true", help="Only show statistics, don't reset")
    
    args = parser.parse_args()
    
    logger.info("🚀 Face Attendance History Reset Tool")
    logger.info(f"📍 Database: {MONGODB_URL}/{DATABASE_NAME}")
    
    # Connect to database
    client, db = connect_to_database()
    if not client or not db:
        logger.error("❌ Failed to connect to database")
        sys.exit(1)
    
    try:
        # Show current statistics
        stats = get_attendance_stats(db)
        logger.info(f"📊 Current attendance records: {stats['total']}")
        
        if stats["total"] > 0 and stats["oldest"] and stats["newest"]:
            logger.info(f"📅 Date range: {stats['oldest']} to {stats['newest']}")
        
        # If only showing stats, exit here
        if args.stats_only:
            logger.info("📋 Statistics only mode - no changes made")
            return
        
        if stats["total"] == 0:
            logger.info("📭 No attendance records found. Nothing to reset.")
            return
        
        # Create backup if requested
        if args.backup:
            logger.info("💾 Creating backup...")
            if not backup_attendance_history(db, args.backup_file):
                logger.error("❌ Backup failed. Aborting reset.")
                sys.exit(1)
        
        # Reset attendance history
        logger.info("🗑️ Resetting attendance history...")
        success = reset_attendance_history(db, args.confirm)
        
        if success:
            logger.info("✅ Attendance history reset completed successfully!")
            
            # Show final stats
            final_stats = get_attendance_stats(db)
            logger.info(f"📊 Final attendance records: {final_stats['total']}")
        else:
            logger.error("❌ Failed to reset attendance history")
            sys.exit(1)
    
    finally:
        # Close database connection
        client.close()
        logger.info("📤 Database connection closed")

if __name__ == "__main__":
    main() 