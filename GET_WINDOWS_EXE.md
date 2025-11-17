# Get Your Windows .exe in 5 Minutes! 🚀

**Cross-compiling from macOS to Windows is very difficult.** The easiest way is to use GitHub Actions to build on actual Windows servers (FREE!).

## Step-by-Step Guide:

### 1. Check if you have a GitHub account
- If not, create one at https://github.com/signup

### 2. Create a new repository on GitHub
- Go to https://github.com/new
- Repository name: `qc-image-checker`
- Visibility: Public or Private (your choice)
- Click **Create repository**

### 3. Push your code to GitHub

Open Terminal in your project folder and run:

```bash
cd /Users/zubair/Documents/CC_QC/QC_R/qc-app

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit with Windows build setup"

# Add your GitHub repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/qc-image-checker.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note**: If you get authentication errors, you may need to:
- Generate a Personal Access Token at https://github.com/settings/tokens
- Use it as your password when pushing

### 4. Trigger the Build

Option A: **Automatic** (already triggered by the push)
- The workflow runs automatically when you push to `main` branch
- Go to your repository → **Actions** tab
- You should see "Build Multi-Platform Apps" workflow running

Option B: **Manual Trigger**
- Go to your repository on GitHub
- Click **Actions** tab
- Click **Build Multi-Platform Apps** on the left
- Click **Run workflow** button (top right)
- Select branch: `main`
- Click green **Run workflow** button

### 5. Wait for Build to Complete
- The build takes about 10-15 minutes
- You can watch the progress in real-time
- Windows, macOS, and Linux builds run in parallel

### 6. Download Your Windows .exe

Once the build completes (green checkmark):
1. Click on the completed workflow run
2. Scroll to the bottom to **Artifacts** section
3. Download **windows-app** (it's a .zip file)
4. Extract the .zip file
5. You'll find:
   - `QC Image Checker_1.0.0_x64-setup.exe` ← **This is your installer!**
   - `QC Image Checker_1.0.0_x64_en-US.msi` ← **Alternative MSI installer**

### 7. Test Your Windows App
- Copy the .exe to a Windows PC
- Double-click to install
- Your QC Image Checker app will be installed!

---

## Troubleshooting

### "git remote add" fails with "remote origin already exists"
```bash
# Remove the old remote and add new one
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/qc-image-checker.git
git push -u origin main
```

### GitHub asks for username/password
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your GitHub password)
- Generate token at: https://github.com/settings/tokens (select `repo` permissions)

### Build fails on GitHub Actions
- Check the error logs in the Actions tab
- Common issues:
  - Missing dependencies (usually auto-installed)
  - Syntax errors in code (test locally first: `npm run build`)

### Want to build only for Windows?
Edit `.github/workflows/build.yml` and comment out macOS and Linux platforms.

---

## Why Use GitHub Actions Instead of Building Locally?

✅ **No Windows PC needed** - Runs on GitHub's Windows servers
✅ **Free for public repos** - Unlimited minutes
✅ **Builds all platforms** - Windows, macOS, Linux automatically
✅ **No setup required** - All tools pre-installed
✅ **Professional CI/CD** - Industry standard approach
✅ **Consistent builds** - Same environment every time

---

## Alternative: Build on a Windows PC

If you have access to a Windows computer:

```bash
# On Windows:
git clone https://github.com/YOUR_USERNAME/qc-image-checker.git
cd qc-image-checker

# Install prerequisites (one-time):
# - Node.js: https://nodejs.org/
# - Rust: https://rustup.rs/
# - Visual Studio Build Tools: https://visualstudio.microsoft.com/downloads/

# Build:
npm install
npm run tauri:build:windows

# Output: src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Build for macOS (local) | `npm run tauri:build` |
| Build for macOS Universal | `npm run tauri:build:mac` |
| Build for Windows (GitHub) | Push to GitHub → Actions |
| Build for all platforms | Push to GitHub → Actions |
| Create release | `git tag v1.0.0 && git push origin v1.0.0` |

---

## Next Steps After Getting Your .exe

1. **Test on Windows** - Install and verify it works
2. **Distribute** - Share the .exe with users
3. **Sign the app** (optional) - For production use, consider code signing
4. **Update version** - Edit `version` in `tauri.conf.json` and `package.json`

---

## Need Help?

- GitHub Actions documentation: https://docs.github.com/actions
- Tauri building guide: https://tauri.app/v1/guides/building/
- Issues with this setup? Check the Actions logs for details

**The GitHub Actions approach is the RECOMMENDED way to get a Windows .exe from macOS!**
