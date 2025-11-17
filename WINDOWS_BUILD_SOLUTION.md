# ✅ Solution: Build Windows .exe from macOS

## ❌ Why Local Build Failed

You just saw these errors when trying `npm run tauri:build:windows`:
```
Error: called `Result::unwrap()` on an `Err` value: NotAttempted("llvm-rc")
Error: 'stdlib.h' file not found
```

**This is expected!** Cross-compiling from macOS to Windows requires:
- Windows SDK
- MSVC toolchain
- llvm-rc (Windows resource compiler)
- Windows C/C++ headers

These are not available on macOS, making local cross-compilation nearly impossible.

---

## ✅ The Solution: GitHub Actions (FREE & EASY)

GitHub will build your Windows .exe on **actual Windows servers** - for free!

### Quick Start (5 Steps):

#### 1. Create GitHub Repository
- Go to: https://github.com/new
- Repository name: `qc-image-checker`
- Make it Public or Private
- **Don't** check "Add README" or ".gitignore"
- Click **Create repository**

#### 2. Push Your Code

**Option A: Use the setup script (easiest)**
```bash
cd /Users/zubair/Documents/CC_QC/QC_R/qc-app
./SETUP_GITHUB.sh
```

**Option B: Manual commands**
```bash
cd /Users/zubair/Documents/CC_QC/QC_R/qc-app

# Initialize git in this folder (if not already)
git init

# Add files
git add .

# Commit
git commit -m "Initial commit - QC Image Checker"

# Add your GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/qc-image-checker.git

# Push
git branch -M main
git push -u origin main
```

**If you get authentication error:**
- Username: Your GitHub username
- Password: **Use a Personal Access Token** (not your password)
- Create token at: https://github.com/settings/tokens
  - Click "Generate new token (classic)"
  - Select "repo" scope
  - Copy the token and use it as password

#### 3. GitHub Actions Runs Automatically

After you push:
- GitHub Actions detects the `.github/workflows/build.yml` file
- Automatically starts building for Windows, macOS, and Linux
- You can watch progress in real-time

Go to: `https://github.com/YOUR_USERNAME/qc-image-checker/actions`

#### 4. Wait for Build (~10-15 minutes)

The workflow will:
- ✓ Build on Windows Server (actual Windows machine)
- ✓ Build on macOS (for .dmg)
- ✓ Build on Ubuntu (for .deb/.AppImage)

You'll see a green checkmark when done.

#### 5. Download Your Windows .exe

1. Click on the completed workflow run
2. Scroll to bottom → **Artifacts** section
3. Download **windows-app.zip**
4. Extract to find:
   - `QC Image Checker_1.0.0_x64-setup.exe` ← **Your installer!**
   - `QC Image Checker_1.0.0_x64_en-US.msi` ← **MSI installer**

---

## 🎯 What You Get

### Windows
- **NSIS Installer** (.exe) - Most common
- **MSI Installer** (.msi) - For enterprise/IT
- Both include app icon, uninstaller, start menu shortcuts

### macOS (Bonus!)
- **DMG** - Drag-to-install disk image
- **App Bundle** - Universal (Intel + Apple Silicon)

### Linux (Bonus!)
- **AppImage** - Portable executable
- **DEB** - Debian/Ubuntu package

---

## 📊 Comparison: Local vs GitHub Actions

| Method | Time | Success Rate | Platforms | Complexity |
|--------|------|--------------|-----------|------------|
| **Local macOS → Windows** | Hours of setup | ~20% | Windows only | Very High |
| **GitHub Actions** | 15 min | 99% | All 3 platforms | Very Low |
| **Windows PC** | 30 min | 95% | Windows only | Medium |

---

## 🔄 Future Builds

After initial setup, building is super easy:

```bash
# Make your code changes
git add .
git commit -m "Updated feature X"
git push

# GitHub automatically builds all platforms!
# Download from Actions tab when done
```

---

## 🏷️ Creating Releases

For official version releases:

```bash
# Tag a version
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will:
# - Build all platforms
# - Create a GitHub Release (draft)
# - Attach all installers
# - Generate release notes
```

Then go to your repo → **Releases** → Edit draft → Publish

---

## 🆘 Troubleshooting

### "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/qc-image-checker.git
```

### GitHub Actions fails
- Check the logs in Actions tab
- Most common: missing dependencies (usually auto-fixed)
- Verify code builds locally: `npm run build`

### Build takes too long
- First build: ~15 minutes (downloads dependencies)
- Subsequent builds: ~8-10 minutes (cached)

### Can't find the .exe
- Make sure you download **windows-app** artifact
- Extract the .zip file
- Look in the `nsis` folder

---

## 💡 Pro Tips

1. **Test locally first**: Run `npm run build` to catch errors early
2. **Use branches**: Create feature branches, merge to main when ready
3. **Tag releases**: Use semantic versioning (v1.0.0, v1.1.0, etc.)
4. **Cache benefits**: GitHub caches dependencies, making builds faster

---

## 📚 Next Steps

1. ✅ **Push to GitHub** (follow steps above)
2. ✅ **Download Windows .exe** from Actions artifacts
3. ✅ **Test on Windows PC**
4. ✅ **Distribute to users**

---

## 🎉 Summary

**Don't try to build Windows .exe on macOS locally - it's not worth the hassle!**

Use GitHub Actions:
- Free
- Fast (15 min)
- Reliable
- Builds all platforms
- Industry standard

The `.github/workflows/build.yml` file is already set up and ready to go. Just push your code to GitHub and let it do the work!

---

For detailed step-by-step guide, see: [GET_WINDOWS_EXE.md](GET_WINDOWS_EXE.md)
