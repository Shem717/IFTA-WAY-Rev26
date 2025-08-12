# Local Development Setup for IFTA WAY

This guide provides step-by-step instructions for setting up the IFTA WAY project for local development.

## Prerequisites

- **Node.js**: Version 20 or higher. You can use a tool like `nvm` to manage Node.js versions.
- **Firebase CLI**: The command-line interface for Firebase. Install it globally:
  ```bash
  npm install -g firebase-tools
  ```
- **Firebase Project**: You must have an active Firebase project with the following services enabled:
  - Authentication (with Google and Email/Password providers enabled)
  - Firestore Database
  - Cloud Storage
  - Cloud Functions

## 1. Clone the Repository

First, clone the project repository to your local machine:

```bash
git clone <repository-url>
cd <repository-folder>
```

## 2. Configure Firebase

Log in to the Firebase CLI and associate the project with your Firebase project:

```bash
firebase login
firebase use --add
```
Select your Firebase project from the list when prompted.

## 3. Setup Frontend (`iftaway-frontend`)

### 3.1. Install Dependencies

Navigate to the frontend directory and install the required npm packages:

```bash
cd iftaway-frontend
npm install
```

### 3.2. Create Environment File

The frontend requires a Firebase configuration file to connect to your Firebase project.

1.  Go to your Firebase project settings (`Project Settings` > `General`).
2.  Under "Your apps", find your web app and click on the "SDK setup and configuration" section.
3.  Select "Config" and copy the `firebaseConfig` object.
4.  In the `iftaway-frontend` directory, create a file named `.env.production`.
5.  Paste the configuration into the file, formatting it as Vite environment variables:

    ```env
    # .env.production
    VITE_FIREBASE_API_KEY="your-api-key"
    VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
    VITE_FIREBASE_PROJECT_ID="your-project-id"
    VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
    VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
    VITE_FIREBASE_APP_ID="your-app-id"
    ```

### 3.3. Run the Development Server

Start the Vite development server to run the frontend locally:

```bash
npm run dev
```
The application should now be running on `http://localhost:5173`.

## 4. Setup Backend (`functions`)

### 4.1. Install Dependencies

Navigate to the functions directory and install its dependencies:

```bash
cd ../functions
npm install
```

### 4.2. Set Backend Environment Variables

The backend Cloud Functions may require API keys or other configuration. For the `processReceipt` function, you need a Google AI API key.

1.  Enable the "Generative Language API" in your Google Cloud project associated with Firebase.
2.  Create an API key for it.
3.  Set the environment variable for the Firebase Functions:
    ```bash
    firebase functions:config:set gemini.apikey="YOUR_GEMINI_API_KEY"
    ```

### 4.3. Run the Firebase Emulators

To test the backend functions locally, use the Firebase Emulator Suite.

First, build the TypeScript source code:
```bash
npm run build
```

Then, start the emulators for Functions, Auth, and Firestore:
```bash
firebase emulators:start --only functions,auth,firestore
```

The emulators will provide local endpoints for your services, and the frontend (if configured correctly in `firebase.ts`) will automatically connect to them when running on `localhost`.

## 5. Running Tests

To run the end-to-end tests for the frontend, use the following command from the `iftaway-frontend` directory:

```bash
cd ../iftaway-frontend
npm run test
```
---

You now have a complete local development environment for both the frontend and backend of the IFTA WAY application.
