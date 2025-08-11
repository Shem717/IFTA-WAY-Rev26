#!/bin/bash

# IFTA WAY Deployment Script
# This script builds and deploys the entire application

set -e

echo "🚀 Starting IFTA WAY deployment..."

# Build frontend
echo "📦 Building frontend..."
cd iftaway-frontend
npm run build
cd ..

# Build functions
echo "⚡ Building functions..."
cd functions
npm run build
cd ..

# Deploy everything
echo "🌐 Deploying to Firebase..."
firebase deploy

echo "✅ Deployment complete!"
echo "🔗 Your app is live at: https://iftaway.web.app/"