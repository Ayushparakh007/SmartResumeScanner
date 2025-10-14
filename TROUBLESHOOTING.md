# Troubleshooting Guide

## Gemini API Error: 403 Forbidden - "Method doesn't allow unregistered callers"

This error means the API key is not being passed correctly to the Gemini API.

### Solution Steps:

#### 1. Check if .env file exists
```powershell
Test-Path .env
```
If it returns `False`, create it:
```powershell
Copy-Item .env.example .env
```

#### 2. Verify .env file contents
```powershell
Get-Content .env
```
Should show:
```
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
```

#### 3. Get your Gemini API Key
1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key

#### 4. Update .env file
Open `.env` in your editor and replace `your_gemini_api_key_here` with your actual key:
```
GEMINI_API_KEY=AIzaSyD_your_actual_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
```

**Important**: The API key should start with `AIzaSy`

#### 5. Restart the dev server
**Stop** the server (Ctrl+C) and restart:
```powershell
npm run dev
```

#### 6. Test the configuration
Visit: http://localhost:3000/api/config-check

You should see:
```json
{
  "success": true,
  "config": {
    "apiKeyConfigured": true,
    "apiKeyLength": 39,
    "model": "gemini-2.0-flash-exp"
  },
  "message": "✓ Configuration looks good!"
}
```

## Supported Gemini Models

You can use any of these models in your `.env` file:

- `gemini-2.0-flash-exp` ✅ (Recommended - latest, fastest, free tier)
- `gemini-2.5-flash` ✅ (Alternative latest model)
- `gemini-1.5-flash` (Fast, efficient)
- `gemini-1.5-pro` (More capable, slower)

**Note:** We're using the `@google/genai` SDK (v0.3.0)

## Other Common Issues

### Port 3000 already in use
Edit `.env` and change:
```
PORT=3001
```

### "Failed to parse PDF" error
- Ensure uploaded file is a valid PDF
- Check file size (max 10MB by default)
- Try uploading as text file instead

### Environment variables not loading
Make sure:
1. `.env` file is in the **root directory** (same folder as `package.json`)
2. Server was restarted after creating/editing `.env`
3. No spaces around the `=` sign in `.env` file

### API Key validation
Run this in PowerShell to verify your key is set:
```powershell
# Load .env manually and test
$envFile = Get-Content .env
$apiKey = ($envFile | Where-Object { $_ -like "GEMINI_API_KEY=*" }) -replace "GEMINI_API_KEY=", ""
Write-Host "API Key: $($apiKey.Substring(0, 10))..." -ForegroundColor Green
Write-Host "Length: $($apiKey.Length)" -ForegroundColor Green
```

A valid key should be around 39 characters long.

## Still Having Issues?

1. Check the server console for error messages
2. Test the `/api/config-check` endpoint
3. Verify your API key works at: https://aistudio.google.com/app/apikey
4. Make sure you have billing enabled if using paid models (free tier should work for testing)

## Getting Help

Include this information when asking for help:
- Output of `/api/config-check`
- Server console error message
- Model name you're trying to use
- Whether your API key is from Google AI Studio (aistudio.google.com)
