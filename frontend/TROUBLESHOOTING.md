# Frontend-Backend Connection Troubleshooting

## Verify API Connection

### 1. Check Backend is Running
```bash
# In backend directory
cd backend
uvicorn app.main:app --reload
# Should see: "Uvicorn running on http://0.0.0.0:8000"
```

### 2. Test API Endpoint Directly
Open browser and go to: `http://localhost:8000/docs`

Or test with curl:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@test.com&password=admin123"
```

### 3. Check Frontend Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to login
4. Look for:
   - "Attempting login with: [email]"
   - "Login successful, fetching user data..."
   - Any error messages

### 4. Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try to login
4. Look for request to: `http://localhost:8000/api/v1/auth/login`
5. Check:
   - Status code (should be 200)
   - Request payload
   - Response data

### 5. Check CORS Settings
In `backend/app/main.py`, ensure CORS includes your frontend URL:
```python
CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://localhost:5173,http://localhost:8080"
```

### 6. Check Environment Variable
Create `.env` file in `frontend/` directory:
```
VITE_API_BASE_URL=http://localhost:8000
```

Or check if it's set in your environment.

## Common Issues

### Issue: "Network Error" or "Failed to fetch"
- **Cause**: Backend not running or wrong URL
- **Fix**: Start backend and verify URL

### Issue: "CORS error"
- **Cause**: Backend not allowing frontend origin
- **Fix**: Add frontend URL to CORS_ORIGINS in backend config

### Issue: "401 Unauthorized"
- **Cause**: Wrong credentials or token expired
- **Fix**: Use correct email/password from database

### Issue: "404 Not Found"
- **Cause**: Wrong API endpoint URL
- **Fix**: Check `VITE_API_BASE_URL` is correct

## Debug Steps

1. **Check browser console** for error messages
2. **Check Network tab** to see if requests are being sent
3. **Check backend logs** for incoming requests
4. **Test API directly** using FastAPI docs or curl
5. **Verify credentials** exist in database

## Test Credentials

From database initialization:
- Email: `admin@test.com`
- Password: `admin123`
- Role: `owner`

