# Quick Build Guide - QC Image Checker

## 🚀 Three Ways to Build Windows .exe

### Method 1: GitHub Actions (EASIEST - Recommended)
1. Push your code to GitHub
2. Go to **Actions** tab in your GitHub repository
3. Click **Run workflow** → **Build Multi-Platform Apps**
4. Wait for build to complete (~10-15 minutes)
5. Download the Windows .exe from **Artifacts**

✅ **Benefits**:
- Builds for Windows, macOS, and Linux automatically
- No need for Windows machine
- Professional CI/CD setup

---

### Method 2: Build on Windows Machine
If you have access to a Windows PC:

```bash
# On Windows:
git clone <your-repo>
cd qc-app
npm install
npm run tauri:build:windows
```

Output: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/*.exe`

---

### Method 3: Cross-Compile from macOS (Limited)

```bash
# On your Mac:
rustup target add x86_64-pc-windows-msvc
cargo install cargo-xwin
npm run tauri:build:windows
```

⚠️ **Note**: May have limitations with installer bundles

---

## 📦 Available Build Commands

```bash
# Build for current platform
npm run tauri:build

# Build for macOS (Universal - M1 + Intel)
npm run tauri:build:mac

# Build for macOS Intel only
npm run tauri:build:mac-intel

# Build for macOS Apple Silicon only
npm run tauri:build:mac-silicon

# Build for Windows
npm run tauri:build:windows
```

---

## 📥 Build Outputs

After building, find your apps here:

### Windows
- **Installer**: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/QC Image Checker_1.0.0_x64-setup.exe`
- **MSI**: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/QC Image Checker_1.0.0_x64_en-US.msi`

### macOS
- **DMG**: `src-tauri/target/universal-apple-darwin/release/bundle/dmg/QC Image Checker_1.0.0_universal.dmg`
- **App**: `src-tauri/target/universal-apple-darwin/release/bundle/macos/QC Image Checker.app`

### Linux
- **AppImage**: `src-tauri/target/release/bundle/appimage/qc-image-checker_1.0.0_amd64.AppImage`
- **DEB**: `src-tauri/target/release/bundle/deb/qc-image-checker_1.0.0_amd64.deb`

---

## 🔥 Quick Start with GitHub Actions

1. **Create a GitHub Repository** (if you haven't):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/qc-app.git
   git push -u origin main
   ```

2. **Trigger Build**:
   - Push any commit to `main` branch, OR
   - Go to Actions → Run workflow manually

3. **Download Builds**:
   - Go to Actions tab
   - Click on the latest workflow run
   - Scroll to "Artifacts" section
   - Download `windows-app`, `macos-app`, or `linux-app`

---

## 🏷️ Creating Release Builds

To create official releases with auto-generated changelogs:

```bash
# Tag your version
git tag v1.0.0
git push origin v1.0.0
```

This will:
- Automatically build for all platforms
- Create a GitHub Release draft
- Attach all installers to the release

---

## ⚙️ Configuration Files

- **Tauri Config**: `src-tauri/tauri.conf.json` - App settings, bundle config
- **Package.json**: `package.json` - Build scripts
- **GitHub Actions**: `.github/workflows/build.yml` - CI/CD automation
- **Icons**: `src-tauri/icons/` - App icons for each platform

---

## 🐛 Troubleshooting

### Build fails on GitHub Actions
- Check the Actions log for specific errors
- Ensure all dependencies are in `package.json`
- Verify Rust code compiles: `cd src-tauri && cargo build`

### Windows build missing .ico icon
- Verify `src-tauri/icons/icon.ico` exists
- Check it's referenced in `tauri.conf.json`

### macOS build not universal
- Use: `npm run tauri:build:mac` (not just `tauri:build`)

---

## 📚 More Info

See [BUILD_WINDOWS.md](BUILD_WINDOWS.md) for detailed instructions.
