# QC Image Checker - Build Instructions

## ✨ What's Been Set Up

Your QC Image Checker app is now configured to build Windows .exe files (and macOS/Linux too)!

### Files Added:
1. `.github/workflows/build.yml` - Automated builds for Windows, macOS, Linux
2. `QUICK_BUILD_GUIDE.md` - Quick reference for building
3. `BUILD_WINDOWS.md` - Detailed Windows build instructions
4. Enhanced `src-tauri/tauri.conf.json` - Windows installer configuration

### Build Scripts Available:
- `npm run tauri:build` - Build for current platform
- `npm run tauri:build:windows` - Build Windows .exe
- `npm run tauri:build:mac` - Build macOS Universal app
- `npm run tauri:build:mac-intel` - Build macOS Intel app
- `npm run tauri:build:mac-silicon` - Build macOS Apple Silicon app

---

## 🎯 Recommended: Use GitHub Actions

**This is the EASIEST way to get a Windows .exe without needing a Windows PC!**

### Step 1: Push to GitHub
```bash
cd /Users/zubair/Documents/CC_QC/QC_R/qc-app

# Initialize git (if not already done)
git init
git add .
git commit -m "Setup Windows build configuration"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/qc-image-checker.git
git branch -M main
git push -u origin main
```

### Step 2: Run the Build
1. Go to your GitHub repository
2. Click **Actions** tab
3. Click **Build Multi-Platform Apps** workflow
4. Click **Run workflow** button
5. Select branch: `main`
6. Click **Run workflow**

### Step 3: Download Your Windows .exe
1. Wait ~10-15 minutes for build to complete
2. Go to the completed workflow run
3. Scroll to **Artifacts** section at the bottom
4. Download **windows-app.zip**
5. Extract to find your installer:
   - `QC Image Checker_1.0.0_x64-setup.exe` (NSIS installer)
   - `QC Image Checker_1.0.0_x64_en-US.msi` (MSI installer)

---

## 🖥️ Alternative: Build on Windows

If you have a Windows PC, you can build directly:

### Prerequisites:
1. [Node.js](https://nodejs.org/) v18+
2. [Rust](https://www.rust-lang.org/tools/install)
3. [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)

### Build:
```bash
npm install
npm run tauri:build:windows
```

Output: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/`

---

## 📦 What Gets Built

### Windows (from GitHub Actions or Windows PC):
- **Setup.exe**: Full installer with uninstaller
- **MSI**: Windows Installer package
- Both include your app icon and branding

### macOS (from macOS or GitHub Actions):
- **DMG**: Drag-to-Applications installer
- **App Bundle**: Standalone .app
- Universal binary (Intel + Apple Silicon)

### Linux (from Linux or GitHub Actions):
- **AppImage**: Portable executable
- **DEB**: Debian/Ubuntu package

---

## 🚀 Creating Official Releases

To create version releases with automatic changelogs:

```bash
# Tag your release
git tag v1.0.0
git commit -m "Release v1.0.0"
git push origin v1.0.0
```

GitHub Actions will:
- Build all platforms automatically
- Create a draft GitHub Release
- Attach all installers
- Generate release notes

---

## 📝 App Configuration

Current settings (edit in `src-tauri/tauri.conf.json`):

- **App Name**: QC Image Checker
- **Version**: 1.0.0
- **Identifier**: com.qc.imagechecker
- **Window Size**: 1400x900
- **Icon**: src-tauri/icons/icon.ico (Windows)

To change version:
1. Edit `version` in `src-tauri/tauri.conf.json`
2. Edit `version` in `package.json`
3. Commit and rebuild

---

## 🔍 Verifying Your Setup

Check everything is ready:

```bash
# Check icon exists
ls -la src-tauri/icons/icon.ico

# Check Rust is installed
rustc --version

# Check Node is installed
node --version

# Verify Tauri CLI works
npm run tauri --version
```

---

## 📚 Documentation

- **Quick Guide**: [QUICK_BUILD_GUIDE.md](QUICK_BUILD_GUIDE.md)
- **Windows Details**: [BUILD_WINDOWS.md](BUILD_WINDOWS.md)
- **Tauri Docs**: https://tauri.app/v1/guides/building/

---

## 💡 Tips

1. **First time building?** Use GitHub Actions - it's automated and free
2. **Need to test locally?** Build on your Mac with `npm run tauri:build`
3. **Want to distribute?** Windows users prefer .exe, Mac users prefer .dmg
4. **Code signing?** For production apps, consider signing certificates

---

## 🆘 Need Help?

- Check build logs in GitHub Actions
- Review [BUILD_WINDOWS.md](BUILD_WINDOWS.md) for troubleshooting
- Ensure all dependencies are installed
- Try building on your Mac first to verify code compiles

---

## ✅ Next Steps

1. **Test on macOS**: Run `npm run tauri:build` to verify it builds on your Mac
2. **Push to GitHub**: Set up the repository and workflow
3. **Run GitHub Actions**: Get your Windows .exe!
4. **Distribute**: Share the installer with Windows users

Your app is ready to build for all platforms! 🎉
