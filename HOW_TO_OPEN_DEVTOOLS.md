# How to Open DevTools / Console in Windows App

To see the debug logs (`[Save]`, `[CSV]`, `[State]`, `[Record]` messages), you need to access the browser console.

---

## Method 1: Keyboard Shortcuts ⌨️

**When the app is running, try these:**

### Option A:
```
Press F12
```

### Option B:
```
Press Ctrl + Shift + I
```

### Option C:
```
Press Ctrl + Shift + J
```

**Result:** DevTools panel should appear on the side or bottom of the window.

---

## Method 2: Right-Click Menu 🖱️

1. **Right-click** anywhere in the app window (not on buttons)
2. Look for **"Inspect"** or **"Inspect Element"** in the menu
3. Click it
4. DevTools will open
5. Click the **"Console"** tab

---

## Method 3: Build with Console Window Enabled 🪟

If the above methods don't work, the DevTools might be disabled in the release build.

**Solution: Build a debug version with console window**

### Quick Fix - Edit Source Code:

**File:** `src-tauri/src/main.rs`

**Change line 2 from:**
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
```

**To:**
```rust
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
```

(Just add `//` at the start to comment it out)

**Then rebuild:**
```bash
git add .
git commit -m "Enable console window for debugging"
git push
```

Rebuild via GitHub Actions and download new windows-app.

**Result:** When you run the .exe, a **black console window** will appear alongside the app showing all logs in real-time!

---

## Method 4: Run in Dev Mode 🛠️

**On Windows PC:**

```bash
# Clone/download your project
git clone https://github.com/YOUR_USERNAME/qc-image-checker.git
cd qc-image-checker

# Install dependencies
npm install

# Run in development mode
npm run dev
```

**Result:**
- Browser window opens with DevTools available
- Press F12 to open console
- All logs visible in real-time

---

## What You'll See in Console

Once DevTools is open, you should see logs like this:

```
[Record] Creating new record for: comparison-123-20241117-front-abc-view1.jpg
[Record] Parsed filename data: {namespace: "front", receivedDate: "17/11/2024", ...}
[Record] New record created: {Week Number: "47", QC Date: "17/11/2024 14:30:25", ...}

[Save] Starting save operation...
[Save] Saving CSV to: C:\Users\Zubair\Documents\Images\Zubair_2024-11-17_14_30.CSV

[CSV] Attempting to save CSV to: C:\Users\Zubair\Documents\Images\Zubair_2024-11-17_14_30.CSV
[CSV] Records to save: 1
[CSV] ✓ CSV saved successfully

[Save] ✓ CSV saved
[Save] Saving state...

[State] Saving state to: C:\Users\Zubair\Documents\Images\Images.json
[State] State data size: 4567 bytes
[State] Number of results: 1
[State] ✓ State saved successfully

[Save] ✓ State saved
[Save] ✓✓ All data saved successfully
```

---

## Troubleshooting DevTools

### Issue: F12 doesn't work

**Try:**
- Ctrl + Shift + I
- Ctrl + Shift + J
- Right-click → Inspect

**If none work:** DevTools are disabled in release build
→ Use Method 3 (enable console window)

### Issue: Right-click menu doesn't show "Inspect"

**Reason:** Context menu disabled in release build

**Solution:** Use Method 3 or Method 4

### Issue: Want to see logs without DevTools

**Solution:** Use Method 3 - the console window will show all logs

**Visual:**
```
┌─────────────────────────────┐
│  Console Window (cmd)       │
│  [Save] Starting...         │
│  [CSV] ✓ CSV saved         │
│  [State] ✓ State saved     │
└─────────────────────────────┘

┌─────────────────────────────┐
│  QC Image Checker App       │
│  [Your app interface]       │
│                             │
└─────────────────────────────┘
```

---

## Recommended for Debugging

**For testing the fixes, I recommend:**

### Option A: Enable Console Window (Best for Windows)

1. Comment out line 2 in `src-tauri/src/main.rs`
2. Rebuild
3. Run the .exe
4. You'll get a console window showing all logs automatically

### Option B: Run in Dev Mode (Best for detailed debugging)

1. Install Node.js and Rust on Windows
2. Clone the project
3. Run `npm run dev`
4. Press F12 for full DevTools

---

## Quick Command Reference

| Task | Command |
|------|---------|
| Open DevTools | F12 or Ctrl+Shift+I |
| Open Console Tab | Click "Console" in DevTools |
| Clear Console | Right-click in console → "Clear console" |
| Search Logs | Ctrl+F in console |
| Filter Logs | Type "[CSV]" in filter box |

---

## Testing Checklist with Console Open

With console open, do this:

1. ✅ Load first image
   - Look for: `[Record] Creating new record`
   - Verify: Week Number, QC Date shown

2. ✅ Make a QC decision (Q or W)
   - No specific log, but state changes

3. ✅ Press Tab to go to next image
   - Look for: `[Save] Starting save operation...`
   - Look for: `[CSV] ✓ CSV saved successfully`
   - Look for: `[State] ✓ State saved successfully`
   - Look for: `[Save] ✓✓ All data saved successfully`

4. ✅ Check for any errors
   - Red text = error
   - `✗` symbol = failed operation

---

## Need More Help?

If you still can't access the console:

1. **Send screenshot** of the app running
2. **Describe** which method you tried
3. **Include** Windows version (Windows 10/11)
4. **Tell me** if you're using the .exe from GitHub Actions

I can help you enable debugging mode!

---

## Summary

**Quickest Method:**
```
Press F12 while app is running
```

**Most Reliable Method (for Windows .exe):**
```
1. Comment out line 2 in src-tauri/src/main.rs
2. Rebuild app
3. Console window appears automatically
```

**Best for Development:**
```
npm run dev
Then press F12
```
