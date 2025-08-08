# IFTA WAY Frontend

This is the React frontend for IFTA WAY.

## Run Locally

Prerequisites: Node.js

1. Install dependencies:
   `npm install`
2. Create `.env.local` with Firebase config:
   ```
   VITE_FIREBASE_API_KEY=YOUR_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
   VITE_FIREBASE_APP_ID=YOUR_APP_ID
   ```
3. (Optional) Set `GEMINI_API_KEY` in Functions when deploying AI receipt scanning.
4. Run the app:
   `npm run dev`
