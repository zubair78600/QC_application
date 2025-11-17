# Building Windows .exe from macOS

This guide explains how to build a Windows executable (.exe) for the QC Image Checker application.

## Option 1: Build on Windows Machine (Recommended)

The easiest way to build a Windows .exe is to build directly on a Windows machine:

### Prerequisites on Windows:
1. Install [Node.js](https://nodejs.org/) (v18 or later)
2. Install [Rust](https://www.rust-lang.org/tools/install)
3. Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) with:
   - Desktop development with C++
   - Windows 10/11 SDK

### Build Steps on Windows:
```bash
# Clone/copy your project to Windows
cd qc-app

# Install dependencies
npm install

# Build the Windows executable
npm run tauri:build:windows
```

The Windows .exe installer will be created in:
```
src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/
```

---

## Option 2: Cross-Compile from macOS (Advanced)

Cross-compiling from macOS to Windows is possible but complex. Here's how:

### Prerequisites on macOS:
1. Install Rust Windows target:
```bash
rustup target add x86_64-pc-windows-msvc
```

2. Install cargo-xwin (cross-compilation tool):
```bash
cargo install cargo-xwin
```

3. Install Wine (to run Windows tools):
```bash
brew install wine-stable
```

### Build Steps:
```bash
# Build using cargo-xwin
npm run tauri build -- --target x86_64-pc-windows-msvc --bundles none
```

**Note**: Cross-compilation from macOS has limitations:
- May not create full installer bundles (NSIS/MSI)
- Icon embedding might not work properly
- Requires additional Windows SDK setup

---

## Option 3: GitHub Actions CI/CD (Best for Teams)

Use GitHub Actions to automatically build for Windows, macOS, and Linux.

Create `.github/workflows/build.yml`:

```yaml
name: Build Apps

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    strategy:
      matrix:
        platform: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies (Ubuntu only)
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev librsvg2-dev

      - name: Install npm dependencies
        run: npm install

      - name: Build Tauri app
        run: npm run tauri:build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: app-${{ matrix.platform }}
          path: |
            src-tauri/target/release/bundle/
```

Push to GitHub and download builds from Actions tab.

---

## Current Build Commands

The project has these build scripts configured:

```json
{
  "tauri:build": "npm run tauri build",
  "tauri:build:mac": "npm run tauri build -- --target universal-apple-darwin",
  "tauri:build:mac-intel": "npm run tauri build -- --target x86_64-apple-darwin",
  "tauri:build:mac-silicon": "npm run tauri build -- --target aarch64-apple-darwin",
  "tauri:build:windows": "npm run tauri build -- --target x86_64-pc-windows-msvc"
}
```

## Build Outputs

### Windows:
- **NSIS Installer**: `QC Image Checker_1.0.0_x64-setup.exe`
- **MSI Installer**: `QC Image Checker_1.0.0_x64_en-US.msi`
- Location: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/`

### macOS:
- **DMG**: `QC Image Checker_1.0.0_universal.dmg`
- **App Bundle**: `QC Image Checker.app`
- Location: `src-tauri/target/universal-apple-darwin/release/bundle/`

### Linux:
- **AppImage**: `qc-image-checker_1.0.0_amd64.AppImage`
- **deb**: `qc-image-checker_1.0.0_amd64.deb`
- Location: `src-tauri/target/release/bundle/`

---

## Troubleshooting

### "target not found" error:
```bash
rustup target add x86_64-pc-windows-msvc
```

### Build fails on Windows:
- Ensure Visual Studio Build Tools are installed
- Run from "Developer Command Prompt for VS"

### Icon not showing on Windows:
- Verify `icons/icon.ico` exists
- Check `tauri.conf.json` includes the .ico file

---

## Recommended Approach

**For production releases**: Use **GitHub Actions** (Option 3) or build on a **Windows VM/machine** (Option 1).

**For testing**: Cross-compile from macOS (Option 2), but expect limitations.
