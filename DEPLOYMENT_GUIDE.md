# IFTA WAY - Deployment and Issue Resolution Guide

## 🚀 Deployment Process

### Current Status
- **Manual Deployment Required**: Changes pushed to GitHub do NOT automatically deploy to Firebase
- **Live Site**: https://iftaway.web.app/
- **Deployment Latency**: No automatic deployment = no latency, but requires manual action

### Quick Deploy (Manual)
```bash
# Option 1: Use the new deployment script
./deploy.sh

# Option 2: Manual steps
cd iftaway-frontend && npm run build && cd ..
cd functions && npm run build && cd ..
firebase deploy
```

### Automatic Deployment (GitHub Actions)
I've created a GitHub Actions workflow (`.github/workflows/deploy.yml`) that will:
- Automatically deploy when you push to `main` or `master` branch
- Build both frontend and functions
- Deploy to Firebase hosting

**To activate automatic deployment:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key (JSON file)
3. In GitHub: Settings → Secrets → Add `FIREBASE_SERVICE_ACCOUNT_IFTAWAY` with the JSON content
4. Push to main branch - deployment will happen automatically

## 🔧 Receipt Function Issues

### Root Cause Analysis
The Firestore HTTP 400 errors and receipt function failures are likely due to:

1. **Function Not Deployed**: The `scanReceipt` function exists in code but may not be deployed
2. **Missing API Key**: Requires `GEMINI_API_KEY` secret in Firebase
3. **Authentication Issues**: Firestore connection problems

### Immediate Fixes Applied
1. **Enhanced Error Handling**: Updated `aiService.ts` with better error messages
2. **Function Deployment**: Built functions successfully
3. **Deployment Scripts**: Created automated deployment tools

### Required Actions
1. **Deploy Functions**:
   ```bash
   cd functions
   firebase deploy --only functions
   ```

2. **Set Gemini API Key**:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   # Enter your Google AI Studio API key when prompted
   ```

3. **Verify Firestore Rules**: The rules look correct, but ensure they're deployed:
   ```bash
   firebase deploy --only firestore:rules
   ```

## 🔍 Troubleshooting Steps

### If Receipt Scanning Still Fails:
1. Check browser console for specific error messages
2. Verify user is authenticated (signed in)
3. Test with a clear, well-lit receipt image
4. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only scanReceipt
   ```

### If Firestore Errors Persist:
1. Clear browser cache and cookies
2. Sign out and sign back in
3. Check Firebase Console → Authentication for user status
4. Verify Firestore rules are deployed

## 📋 Next Steps Priority List

1. **Deploy Functions** (Highest Priority)
   - `firebase deploy --only functions`
   - Set GEMINI_API_KEY secret

2. **Test Receipt Scanning**
   - Upload a clear receipt image
   - Check for proper data extraction

3. **Set Up Automatic Deployment**
   - Add Firebase service account to GitHub secrets
   - Test automatic deployment on next push

4. **Monitor Performance**
   - Check Firebase Console for function execution logs
   - Monitor Firestore usage and errors

## 🛠️ Files Modified/Created

- ✅ `iftaway-frontend/src/services/aiService.ts` - Enhanced error handling
- ✅ `deploy.sh` - Manual deployment script
- ✅ `.github/workflows/deploy.yml` - Automatic deployment workflow
- ✅ Functions built successfully

The receipt scanning functionality should work once the functions are deployed and the API key is configured.