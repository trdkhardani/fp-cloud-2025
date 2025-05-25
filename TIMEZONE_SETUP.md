# Timezone Configuration Guide

The Face Attendance System now supports proper timezone handling to ensure timestamps are saved in your local timezone instead of UTC.

## Quick Fix for Ubuntu Deployment

### Option 1: Set System Timezone (Recommended)

```bash
# Check current timezone
timedatectl

# List available timezones
timedatectl list-timezones | grep Asia
timedatectl list-timezones | grep America
timedatectl list-timezones | grep Europe

# Set your timezone (example for Jakarta, Indonesia)
sudo timedatectl set-timezone Asia/Jakarta

# Verify the change
timedatectl
```

### Option 2: Use Environment Variable

```bash
# Create .env file in backend-example directory
cp env.example .env

# Edit the .env file and set your timezone
nano .env

# Set APP_TIMEZONE to your local timezone
APP_TIMEZONE=Asia/Jakarta
```

## Common Timezones

| Location | Timezone |
|----------|----------|
| Jakarta, Indonesia | Asia/Jakarta |
| Singapore | Asia/Singapore |
| Bangkok, Thailand | Asia/Bangkok |
| Manila, Philippines | Asia/Manila |
| Tokyo, Japan | Asia/Tokyo |
| New York, USA | America/New_York |
| Los Angeles, USA | America/Los_Angeles |
| London, UK | Europe/London |
| Sydney, Australia | Australia/Sydney |

## Installation Steps

1. **Install pytz dependency:**
   ```bash
   pip install pytz>=2023.3
   ```

2. **Set timezone environment variable:**
   ```bash
   export APP_TIMEZONE=Asia/Jakarta
   ```

3. **Restart your backend server:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## How It Works

- **Backend**: Now uses `get_local_now()` instead of `datetime.now()` for all timestamps
- **Database**: All new records will be saved with local timezone timestamps
- **API Responses**: All timestamp fields now return local time
- **Attendance Schedule**: Time-based restrictions now work with local time

## Verification

After deployment, check that timestamps are correct:

1. **Check API response:**
   ```bash
   curl http://your-server:8000/api/attendance/mode
   ```

2. **Verify attendance records:**
   ```bash
   curl http://your-server:8000/api/attendance
   ```

3. **Check system time:**
   ```bash
   date
   timedatectl
   ```

## Troubleshooting

### Issue: Still getting UTC timestamps
**Solution**: Restart the backend server after setting timezone

### Issue: Invalid timezone error
**Solution**: Use a valid timezone from the list:
```bash
timedatectl list-timezones
```

### Issue: Environment variable not working
**Solution**: Make sure to export the variable:
```bash
export APP_TIMEZONE=Asia/Jakarta
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Docker Deployment

If using Docker, add timezone to your docker-compose.yml:

```yaml
services:
  backend:
    environment:
      - APP_TIMEZONE=Asia/Jakarta
      - TZ=Asia/Jakarta
    volumes:
      - /etc/localtime:/etc/localtime:ro
```

## Migration Note

- **Existing records**: Will remain in their original timezone (likely UTC)
- **New records**: Will be saved in the configured local timezone
- **Display**: Frontend will show times as received from backend (now in local timezone)

This ensures all future attendance records are saved with the correct local time for your deployment location. 