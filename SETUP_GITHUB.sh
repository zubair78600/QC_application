#!/bin/bash

# Script to set up GitHub repository for QC Image Checker
# This will help you push to GitHub and build Windows .exe

echo "======================================"
echo "QC Image Checker - GitHub Setup"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "ERROR: Please run this script from the qc-app directory"
    echo "cd /Users/zubair/Documents/CC_QC/QC_R/qc-app"
    exit 1
fi

# Check if .git exists
if [ -d ".git" ]; then
    echo "✓ Git repository already initialized"
else
    echo "Initializing new git repository..."
    git init
    echo "✓ Git initialized"
fi

# Create/update .gitignore if needed
if [ ! -f ".gitignore" ]; then
    echo "Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules
dist
dist-ssr

# Tauri
src-tauri/target/
src-tauri/Cargo.lock

# Environment
.env
.env.local

# OS
.DS_Store
Thumbs.db

# Database
*.db
*.db-shm
*.db-wal

# Editor
.vscode/*
!.vscode/extensions.json
.idea
EOF
    echo "✓ .gitignore created"
fi

# Add all files
echo ""
echo "Adding files to git..."
git add .

# Check status
echo ""
echo "Files to be committed:"
git status --short

# Commit
echo ""
read -p "Enter commit message (or press Enter for default): " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="Initial commit - QC Image Checker with Windows build setup"
fi

git commit -m "$commit_msg"
echo "✓ Files committed"

# Ask for GitHub repository URL
echo ""
echo "======================================"
echo "GitHub Repository Setup"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Create a new repository on GitHub: https://github.com/new"
echo "2. Name it: qc-image-checker"
echo "3. Don't initialize with README or .gitignore"
echo "4. Copy the repository URL"
echo ""
read -p "Enter your GitHub repository URL (e.g., https://github.com/username/qc-image-checker.git): " repo_url

if [ -z "$repo_url" ]; then
    echo ""
    echo "No URL provided. You can add it later with:"
    echo "git remote add origin YOUR_REPO_URL"
    echo "git push -u origin main"
else
    # Remove existing remote if it exists
    git remote remove origin 2>/dev/null

    # Add new remote
    git remote add origin "$repo_url"
    echo "✓ Remote added: $repo_url"

    # Try to push
    echo ""
    echo "Pushing to GitHub..."
    git branch -M main
    git push -u origin main

    if [ $? -eq 0 ]; then
        echo ""
        echo "======================================"
        echo "✅ SUCCESS!"
        echo "======================================"
        echo ""
        echo "Your code is now on GitHub!"
        echo ""
        echo "Next steps to get your Windows .exe:"
        echo "1. Go to: ${repo_url%.git}"
        echo "2. Click 'Actions' tab"
        echo "3. You should see 'Build Multi-Platform Apps' running"
        echo "4. Wait ~15 minutes for build to complete"
        echo "5. Download 'windows-app' artifact"
        echo "6. Extract to get your .exe installer!"
        echo ""
    else
        echo ""
        echo "⚠️  Push failed (probably need authentication)"
        echo ""
        echo "To fix this:"
        echo "1. Go to: https://github.com/settings/tokens"
        echo "2. Click 'Generate new token (classic)'"
        echo "3. Give it a name and select 'repo' scope"
        echo "4. Copy the token"
        echo "5. Run: git push -u origin main"
        echo "6. Use your GitHub username and the token as password"
        echo ""
    fi
fi

echo ""
echo "======================================"
echo "Setup complete!"
echo "======================================"
