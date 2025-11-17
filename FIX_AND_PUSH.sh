#!/bin/bash

# Script to commit the fix and push to GitHub

echo "======================================"
echo "Fixing GitHub Actions Workflow"
echo "======================================"
echo ""

cd /Users/zubair/Documents/CC_QC/QC_R/qc-app

# Check if we're in a git repo
if [ ! -d ".git" ]; then
    echo "ERROR: Not a git repository. Please run SETUP_GITHUB.sh first"
    exit 1
fi

# Add the fixed workflow file
echo "Adding fixed workflow file..."
git add .github/workflows/build.yml

# Also add any other changes
git add .

# Commit
echo "Committing the fix..."
git commit -m "Fix: Add missing JavaScriptCore dependency for Linux build"

if [ $? -ne 0 ]; then
    echo "Nothing to commit or commit failed"
    exit 1
fi

# Push
echo ""
echo "Pushing to GitHub..."
git push

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "✅ Fix pushed successfully!"
    echo "======================================"
    echo ""
    echo "The GitHub Actions build should now work!"
    echo ""
    echo "Check the build status at:"
    git remote get-url origin | sed 's/\.git$/\/actions/'
    echo ""
else
    echo ""
    echo "❌ Push failed"
    echo ""
    echo "You may need to pull first or set up authentication"
    echo "Try: git pull --rebase origin main"
    echo "Then: git push"
fi
