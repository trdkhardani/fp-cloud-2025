from datetime import datetime, timezone
import pytz
import os

# Default timezone - can be set via environment variable
DEFAULT_TIMEZONE = os.getenv('APP_TIMEZONE', 'Asia/Jakarta')  # Change this to your local timezone

def get_local_timezone():
    """Get the configured local timezone"""
    try:
        return pytz.timezone(DEFAULT_TIMEZONE)
    except pytz.exceptions.UnknownTimeZoneError:
        # Fallback to UTC if timezone is invalid
        return pytz.UTC

def get_local_now():
    """Get current time in local timezone"""
    local_tz = get_local_timezone()
    return datetime.now(local_tz)

def get_local_time_string():
    """Get current time as string in local timezone"""
    return get_local_now().strftime("%H:%M")

def get_local_date_start():
    """Get start of today in local timezone"""
    local_tz = get_local_timezone()
    now = datetime.now(local_tz)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)

def convert_utc_to_local(utc_datetime):
    """Convert UTC datetime to local timezone"""
    if utc_datetime.tzinfo is None:
        # Assume it's UTC if no timezone info
        utc_datetime = utc_datetime.replace(tzinfo=pytz.UTC)
    
    local_tz = get_local_timezone()
    return utc_datetime.astimezone(local_tz)

def format_local_datetime(dt):
    """Format datetime in local timezone for display"""
    if isinstance(dt, str):
        # Parse ISO string first
        dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
    
    local_dt = convert_utc_to_local(dt)
    return local_dt.isoformat() 