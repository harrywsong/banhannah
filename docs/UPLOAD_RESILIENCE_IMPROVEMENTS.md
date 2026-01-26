# Upload Resilience Improvements

## Overview
Enhanced the file upload system to handle large video uploads more reliably, with automatic retry mechanisms and better error handling for network connection issues.

## Problem
Large video uploads were failing with `net::ERR_CONNECTION_RESET` errors due to:
- Network timeouts during long uploads
- Server connection drops
- Insufficient timeout configurations
- Poor error handling and recovery

## Solutions Implemented

### 1. Frontend Retry Logic (`CourseEditor.jsx`)

**Automatic Retry System:**
- Up to 3 retry attempts for network errors
- Exponential backoff (1s, 2s, 4s delays)
- Intelligent error detection for retryable failures
- Visual feedback during retry attempts

**Enhanced Error Detection:**
```javascript
const isNetworkError = error.code === 'NETWORK_ERROR' || 
                      error.code === 'ECONNRESET' ||
                      error.message.includes('Network Error') ||
                      error.message.includes('timeout') ||
                      error.message.includes('CONNECTION_RESET') ||
                      (error.response && error.response.status >= 500);
```

**Dynamic Timeout Configuration:**
- Videos: 5+ minutes based on file size
- Other files: 1 minute standard timeout
- Size-based timeout calculation: `Math.max(300000, file.size / 1000)`

### 2. Backend Upload Middleware (`middleware/upload.js`)

**Large Upload Handling:**
- Automatic timeout extension for files >50MB
- Progress logging for files >100MB
- Enhanced error handling and cleanup
- Connection monitoring and recovery

**Timeout Management:**
```javascript
const timeoutMs = Math.min(600000, Math.max(300000, contentLength / 1000));
req.setTimeout(timeoutMs);
res.setTimeout(timeoutMs);
```

**Progress Monitoring:**
- Real-time upload progress logging
- Connection error detection
- Graceful error handling and cleanup

### 3. Server Configuration Improvements

**Global Timeout Configuration (`app.js`):**
```javascript
app.use((req, res, next) => {
  if (req.path.includes('/upload') || req.headers['content-type']?.includes('multipart/form-data')) {
    req.setTimeout(600000); // 10 minutes
    res.setTimeout(600000);
  }
  next();
});
```

**Enhanced Upload Controller (`files.controller.js`):**
- Dynamic timeout extension for large videos
- Better error categorization and messages
- Specific handling for common upload errors (ENOSPC, ECONNRESET, etc.)

### 4. User Experience Improvements

**Visual Feedback:**
- Retry status indicators in progress bar
- Color-coded progress (blue = normal, yellow = retrying)
- Clear retry attempt counters
- Helpful tips for video uploads

**Error Messages:**
- Specific messages for video vs. other file types
- Retry attempt information
- Actionable guidance for users

## Technical Details

### Retry Logic Flow
1. **Initial Upload Attempt**: Standard upload with appropriate timeout
2. **Error Detection**: Check if error is network-related and retryable
3. **Retry Decision**: If retryable and under max attempts, schedule retry
4. **Exponential Backoff**: Wait increasing delay between attempts
5. **Visual Feedback**: Show retry status to user
6. **Final Attempt**: After max retries, show comprehensive error

### Timeout Configuration
| File Type | Size Range | Timeout |
|-----------|------------|---------|
| Small files | <50MB | 1 minute |
| Large files | 50-100MB | 5 minutes |
| Videos | >100MB | 10 minutes |
| Huge videos | >500MB | Size-based (up to 10min) |

### Error Handling Categories
1. **Retryable Errors**: Network errors, timeouts, 5xx server errors
2. **Non-retryable Errors**: Authentication, validation, file format issues
3. **Resource Errors**: Storage full, file too large
4. **Connection Errors**: Reset, timeout, network unavailable

## Files Modified

### Frontend
- `frontend/src/components/CourseEditor.jsx` - Enhanced upload handling with retry logic

### Backend
- `backend/src/middleware/upload.js` - New middleware for large upload handling
- `backend/src/routes/files.routes.js` - Added upload middleware to routes
- `backend/src/controllers/files.controller.js` - Enhanced error handling
- `backend/src/app.js` - Global timeout configuration

### Testing
- `scripts/test-video-upload.js` - Test script for upload resilience

## Usage Examples

### Successful Upload with Retry
```
1. User selects 200MB video file
2. Upload starts with 10-minute timeout
3. Connection drops at 50% (network issue)
4. System detects retryable error
5. Shows "재시도 중... (2/4)" message
6. Waits 2 seconds, retries upload
7. Second attempt succeeds
8. File uploaded successfully
```

### Non-retryable Error
```
1. User selects invalid file format
2. Server returns 400 validation error
3. System detects non-retryable error
4. Shows specific error message
5. No retry attempted
```

## Benefits

1. **Improved Success Rate**: Automatic recovery from temporary network issues
2. **Better User Experience**: Clear feedback and progress indication
3. **Reduced Support Load**: Fewer failed uploads requiring manual intervention
4. **Scalability**: Handles large files more efficiently
5. **Reliability**: Robust error handling and recovery mechanisms

## Monitoring

The system now logs:
- Upload attempt details (size, type, timeout)
- Retry attempts and reasons
- Progress for large uploads
- Error categorization and handling
- Final upload outcomes

This enables better monitoring and debugging of upload issues in production.