# GitHub Commit & Rebuild Guide

## 🎯 Goal
Push your code changes to GitHub so it automatically builds a new Windows .exe with all the fixes!

---

## ⚡ Quick Method - Run the Script

**Easiest way:**

```bash
cd /Users/zubair/Documents/CC_QC/QC_R/qc-app
./COMMIT_AND_REBUILD.sh
```

This script will:
1. Show what's changed
2. Ask for confirmation
3. Commit all changes
4. Push to GitHub
5. Show you the Actions link

---

## 📝 Manual Method - Step by Step

If you prefer to do it manually:

### Step 1: Open Terminal

```bash
cd /Users/zubair/Documents/CC_QC/QC_R/qc-app
```

### Step 2: Check What's Changed

```bash
git status
```

You should see modified files in red:
```
modified:   src/App.tsx
modified:   src/services/csvService.ts
modified:   src/services/stateService.ts
modified:   package.json
modified:   .github/workflows/build.yml
```

### Step 3: Add All Changes

```bash
git add .
```

This stages all your changes for commit.

### Step 4: Commit the Changes

```bash
git commit -m "Fix Windows file saving issues and add debug logging"
```

You should see:
```
[main abc1234] Fix Windows file saving issues and add debug logging
 5 files changed, 150 insertions(+), 20 deletions(-)
```

### Step 5: Push to GitHub

```bash
git push origin main
```

You should see:
```
Enumerating objects: 15, done.
Counting objects: 100% (15/15), done.
Writing objects: 100% (8/8), 2.5 KiB | 2.5 MiB/s, done.
To https://github.com/YOUR_USERNAME/qc-image-checker.git
   abc1234..def5678  main -> main
```

✅ **Done!** GitHub Actions will automatically start building.

---

## 🔐 If Push Fails (Authentication Required)

### Error Message:
```
remote: Support for password authentication was removed.
fatal: Authentication failed
```

### Solution: Use Personal Access Token

#### 1. Create Token:
- Go to: https://github.com/settings/tokens
- Click **"Generate new token (classic)"**
- Give it a name: "QC App Deploy"
- Select scope: **✓ repo** (check the box)
- Click **"Generate token"**
- **COPY THE TOKEN** (you won't see it again!)

#### 2. Use Token as Password:
```bash
git push origin main
```

When prompted:
```
Username: your-github-username
Password: paste-your-token-here
```

#### 3. Save Credentials (Optional):
```bash
git config credential.helper store
git push origin main
```

This saves your credentials so you don't need to enter them again.

---

## 📺 Watch the Build on GitHub

### Step 1: Go to Actions Page

```
https://github.com/YOUR_USERNAME/qc-image-checker/actions
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 2: See the Build Running

You'll see:
```
Build Multi-Platform Apps
⚙️ In progress (just now)
```

Click on it to see details.

### Step 3: Monitor Progress

You'll see three jobs running in parallel:
```
✓ macOS     (Building...)
✓ Windows   (Building...)  ← This is the one you want!
✓ Linux     (Building...)
```

**Time:** About 10-15 minutes total

### Step 4: Build Complete!

When done, you'll see:
```
✓ Build Multi-Platform Apps
  Completed in 12m 34s
```

---

## 📥 Download the Windows .exe

### Step 1: Scroll to Bottom

On the completed workflow page, scroll to **Artifacts** section.

### Step 2: Download

Click on:
```
📦 windows-app
```

Downloads a .zip file (~10-20 MB)

### Step 3: Extract

1. Unzip `windows-app.zip`
2. Navigate to the `nsis` folder
3. Find: `QC Image Checker_1.0.0_x64-setup.exe`

### Step 4: Install on Windows

1. Copy the .exe to your Windows PC
2. Double-click to install
3. Run the app
4. Test with your images!

---

## 🐛 Troubleshooting

### Issue: "Permission denied" when pushing

**Solution 1:** Check remote URL
```bash
git remote -v
```

Should show:
```
origin  https://github.com/YOUR_USERNAME/qc-image-checker.git (fetch)
origin  https://github.com/YOUR_USERNAME/qc-image-checker.git (push)
```

**Solution 2:** Use Personal Access Token (see above)

### Issue: "fatal: not a git repository"

**Solution:** You're in the wrong directory
```bash
cd /Users/zubair/Documents/CC_QC/QC_R/qc-app
git status
```

### Issue: GitHub Actions not starting

**Reasons:**
1. Workflow file not in correct location
2. Syntax error in workflow file
3. Actions disabled on repository

**Check:**
```bash
ls -la .github/workflows/build.yml
```

Should exist. If not:
```bash
# File should be there from earlier setup
```

### Issue: Build fails on GitHub Actions

**Check the logs:**
1. Click on the failed job (red X)
2. Expand the failed step
3. Read the error message

**Common fixes:**
- Fixed in our workflow: Linux dependencies (already done ✓)
- Syntax errors: Check the logs for details

---

## ✅ Success Checklist

After pushing and building:

- [ ] Committed changes locally (`git commit`)
- [ ] Pushed to GitHub (`git push origin main`)
- [ ] Saw GitHub Actions running
- [ ] All 3 platforms built successfully (✓ ✓ ✓)
- [ ] Downloaded windows-app artifact
- [ ] Extracted .exe installer
- [ ] Tested on Windows PC
- [ ] Verified fixes:
  - [ ] Week Number populated
  - [ ] QC Date populated
  - [ ] Received Date populated (if in filename)
  - [ ] Namespace populated (if in filename)
  - [ ] CSV file created after navigation
  - [ ] JSON state file created
  - [ ] Data persists after next image

---

## 📊 What's Been Fixed

The new build includes:

**Fixes:**
- ✅ Enhanced logging throughout app
- ✅ Automatic save after record creation
- ✅ Fixed missing Week Number, QC Date fields
- ✅ Better error messages and alerts
- ✅ Fixed Linux build dependencies
- ✅ Added debug mode options

**New Features:**
- ✅ Comprehensive console logging
- ✅ Debug build script
- ✅ DevTools access guide
- ✅ Troubleshooting documentation

---

## 🎉 You're All Set!

**The workflow is:**
1. Make changes to code
2. Run `./COMMIT_AND_REBUILD.sh` OR manually commit & push
3. Wait for GitHub Actions to build (~15 min)
4. Download windows-app artifact
5. Test on Windows!

**Every time you push to `main` branch, GitHub automatically rebuilds!**

---

## Quick Command Reference

| Task | Command |
|------|---------|
| Check status | `git status` |
| Stage changes | `git add .` |
| Commit | `git commit -m "message"` |
| Push | `git push origin main` |
| View remote | `git remote -v` |
| Quick commit & push | `./COMMIT_AND_REBUILD.sh` |

---

## Need Help?

If something isn't working:
1. Check the error message
2. Look in the troubleshooting section above
3. Share the error message for specific help

Good luck! 🚀
