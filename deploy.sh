#!/bin/zsh


# It is recommended to set the GEMINI_API_KEY as a secret in your GitHub repository
# and reference it in your workflow file.
# For example:
# with:
#   GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

# Set the secret in Firebase
if [ -z "$GEMINI_API_KEY" ]; then
  echo "GEMINI_API_KEY is not set. Please set it as a secret in your GitHub repository."
  exit 1
fi
echo "$GEMINI_API_KEY" | firebase functions:secrets:set GEMINI_API_KEY --project=ifta-way-rev26

# Deploy only functions
firebase deploy --only functions
