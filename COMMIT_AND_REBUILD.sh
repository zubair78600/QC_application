#!/bin/bash

# Script to commit fixes and push to GitHub for automatic rebuild

echo "======================================"
echo "QC Image Checker - Commit & Rebuild"
echo "======================================"
echo ""

cd /Users/zubair/Documents/CC_QC/QC_R/qc-app

# Check git status
echo "📝 Checking what's changed..."
git status --short

echo ""
echo "======================================"
echo "Files to be committed:"
echo "======================================"
git diff --name-only

echo ""
read -p "Continue with commit? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "Aborted."
    exit 0
fi

# Add all changes
echo ""
echo "📦 Adding all changes..."
git add .

# Show what will be committed
echo ""
echo "Files staged for commit:"
git diff --cached --name-only

# Commit with message
echo ""
echo "💾 Committing changes..."
git commit -m "Fix Windows file saving issues and add debug logging

- Enhanced logging in CSV and State services
- Fixed missing fields (Week Number, QC Date, etc.)
- Added automatic save after record creation
- Better error messages and user alerts
- Added debug mode and DevTools documentation
- Fixed GitHub Actions Linux dependencies"

if [ $? -ne 0 ]; then
    echo "❌ Commit failed or nothing to commit"
    exit 1
fi

echo ""
echo "✅ Committed successfully!"

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
echo ""

git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "✅ ✅ SUCCESS! ✅ ✅"
    echo "======================================"
    echo ""
    echo "Changes pushed to GitHub!"
    echo ""
    echo "🔄 GitHub Actions is now building your app..."
    echo ""
    echo "Next steps:"
    echo "1. Go to: https://github.com/YOUR_USERNAME/qc-image-checker/actions"
    echo "2. You'll see 'Build Multi-Platform Apps' running"
    echo "3. Wait ~15 minutes for build to complete"
    echo "4. Download 'windows-app' artifact"
    echo "5. Extract and test the new .exe!"
    echo ""
    echo "The new build includes:"
    echo "  ✓ Fixed file saving issues"
    echo "  ✓ Enhanced debug logging"
    echo "  ✓ Fixed missing fields"
    echo "  ✓ Better error messages"
    echo ""
else
    echo ""
    echo "======================================"
    echo "❌ Push Failed"
    echo "======================================"
    echo ""
    echo "Possible reasons:"
    echo "1. Not authenticated - need to set up GitHub credentials"
    echo "2. No internet connection"
    echo "3. Remote repository not set up"
    echo ""
    echo "To fix authentication:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Generate new token (classic)"
    echo "3. Select 'repo' scope"
    echo "4. Copy the token"
    echo "5. Run: git push origin main"
    echo "6. Username: your GitHub username"
    echo "7. Password: paste the token"
    echo ""
fi
