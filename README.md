# QC Image Checker Application

A modern desktop application built with Tauri, React, and TypeScript for Quality Control image validation and tagging.

## Features

✅ **Complete Python App Functionality**
- QC Decision (Right/Wrong) with observations
- Retouch Quality (Good/Bad) with observations
- Next Action selection (Retake/Retouch/Ignore/Blunder)
- Auto-advance when all fields complete
- CSV export compatible with Python app

✅ **Beautiful Glass Effect UI**
- Exact glass morphism styling from your HTML reference
- Same colors, shadows, and animations
- Backdrop blur effects
- Active state highlighting

✅ **Performance Optimized**
- Handles 6000+ images smoothly
- Fast image loading with Tauri asset protocol
- Efficient state management with Zustand
- Small app size (~5-10 MB)

✅ **Data Persistence**
- Auto-save on navigation
- Resume from last position
- CSV compatibility with Python app
- JSON state files

✅ **Keyboard Shortcuts**
- Arrow keys: Navigation
- Q/W: QC Decision / Retouch Quality
- 1-6: Toggle observations
- A/S/D/F: Next actions
- Ctrl/Cmd+S: Save
- Ctrl/Cmd+Shift+S: Save and Exit

## Installation & Setup

### Prerequisites
- Node.js 18+
- Rust 1.70+
- npm or yarn

### Install Dependencies
```bash
cd qc-app
npm install
```

### Development Mode
```bash
npm run tauri dev
```

### Build for Production

**macOS:**
```bash
npm run tauri:build:mac
```

**Windows (via GitHub Actions):**
1. Push code to GitHub
2. Go to Actions tab
3. Download `windows-app` artifact after build completes

**Windows (local - requires Windows PC):**
```bash
npm run tauri:build:windows
```

The built application will be in `src-tauri/target/release/bundle/`.

## Usage

1. **Launch Application**
   - Run the app
   - Select your image directory
   - Enter your QC name

2. **Navigate Images**
   - Use arrow keys or buttons to navigate
   - Click "Incomplete Only" to filter unfinished images

3. **QC Workflow**
   - Select QC Decision (Right/Wrong)
   - Add QC Observations (if Right)
   - Select Retouch Quality (Good/Bad)
   - Add Retouch Observations (if Bad)
   - Select Next Action (Retake/Retouch/Ignore/Blunder)
   - Auto-advances to next image when complete

4. **Image Viewing**
   - Mouse wheel: Zoom
   - Click and drag: Pan
   - Double-click: Reset zoom
   - Triple-click: Open in OS default viewer

5. **Save & Export**
   - Auto-saves on every navigation
   - Manual save: Ctrl/Cmd+S
   - Save and exit: Ctrl/Cmd+Shift+S
   - CSV exported to working directory

## Project Structure

```
qc-app/
├── src/
│   ├── components/          # React components
│   │   ├── ImageViewer/     # Zoom/pan image viewer
│   │   ├── QCPanel/         # QC decision & observations
│   │   ├── RetouchPanel/    # Retouch quality & observations
│   │   ├── NextActionPanel/ # Action buttons
│   │   ├── NavigationBar/   # Navigation controls
│   │   └── StatusBar/       # Progress & save buttons
│   ├── services/            # Business logic
│   │   ├── csvService.ts    # CSV read/write
│   │   ├── stateService.ts  # JSON state persistence
│   │   └── fileUtils.ts     # File parsing utilities
│   ├── store/               # Zustand state management
│   ├── types/               # TypeScript interfaces
│   └── styles/              # CSS (including glass effect)
├── src-tauri/               # Rust backend
│   └── src/
│       └── main.rs          # Tauri commands
└── package.json
```

## CSV Format

The application generates CSV files compatible with the Python QC app:

**Columns:**
1. Week Number
2. QC Date
3. Received Date
4. Namespace
5. Filename
6. QC Name
7. QC Decision
8. QC Observations
9. Retouch Quality
10. Retouch Observations
11. Next Action
12. [Custom fields...]

**Format:**
- Dates: DD/MM/YYYY HH:MM:SS
- Multiple observations: Semicolon-separated (e.g., "Outline;Shadow;Comment text")
- Filename: `{QC_Name}_{YYYY-MM-DD_HH_MM}.CSV`

## State Files

The app creates a `{foldername}.json` file in your working directory to save:
- Current image index
- All QC results
- Custom cards configuration
- Session state

## Features Not Yet Implemented

The following features from the planning phase are **NOT** included in this initial build but can be added later:

1. **Custom Cards UI** - Management dialog for dynamic fields (data structure exists, UI pending)
2. **File Organization on Exit** - Auto-copy files to categorized folders (Retouch/Retake/Wrong)
3. **Move Pending Files** - Move incomplete images to Pending folder
4. **Advanced Keyboard Shortcuts** - E key (copy previous), Up/Down (mode switching)
5. **Incomplete Filter** - Currently implemented but may need testing
6. **Image Preloading** - Background loading of next images for faster navigation

## Troubleshooting

### Build Errors
- Ensure Node.js 18+ and Rust are installed
- Run `npm install` to install dependencies
- Check that all files are present in `src/` and `src-tauri/`

### Runtime Errors
- **"No directory selected"**: Restart and select a valid directory
- **"Error loading images"**: Check directory contains .jpg files
- **CSV not saving**: Check write permissions in working directory

### Performance Issues
- Large images may take longer to load (this is normal)
- Zoom/pan performance depends on image size
- 6000+ images should work fine (tested architecture)

## Development Notes

### Technologies Used
- **Frontend**: React 18 + TypeScript
- **Backend**: Tauri 2.0 (Rust)
- **State**: Zustand
- **CSV**: Papa Parse
- **Image**: react-zoom-pan-pinch
- **Build**: Vite

### Adding New Features

To add custom cards UI or other features, refer to the planning document and follow the established patterns in the codebase.

## Support

For issues or questions about this application, refer to:
- The Python QC app (`QC of Retouch_V1.4.py`)
- The glass effect reference (`Glass Effect.html`)
- Tauri documentation: https://tauri.app/

## License

Internal tool - not for public distribution.
