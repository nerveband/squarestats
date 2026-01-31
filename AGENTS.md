# SquareStats — Agent Instructions

## Project Structure

```
squarestats/
├── manifest.json          # Chrome extension manifest (Manifest V3)
├── background/
│   └── service-worker.js  # Handles downloads via chrome.downloads API
├── content/
│   ├── api.js             # Squarespace API wrapper (fetch with crumb token)
│   └── content.js         # Main extraction logic, runs on squarespace.com
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic, settings, presets
├── utils/
│   ├── constants.js       # API endpoints, report definitions, limits
│   ├── csv.js             # CSV formatting (SqCSV)
│   └── dates.js           # Date utilities, chunking (SqDates)
├── lib/
│   └── jszip.min.js       # ZIP library (vendored)
├── icons/                 # Extension icons (16, 48, 128)
├── logo/                  # Branding assets (not in extension ZIP)
├── screenshots/           # README screenshots (not in extension ZIP)
├── API.md                 # Squarespace API documentation
└── README.md              # User-facing docs
```

## Key Architecture Decisions

- No build step. All JS is vanilla, loaded directly via manifest.json.
- Content scripts run on `*.squarespace.com` and use the site's existing auth (crumb cookie).
- Long date ranges are chunked into 30-day windows to avoid API timeouts.
- Time-series data is deduplicated using local date formatting (not UTC) to match CSV output.
- All exports produce ZIPs containing CSVs + `export-summary.txt` + `export-settings.yaml`.

## Releases

### Version numbering

Use semver: `MAJOR.MINOR.PATCH`. Bump `manifest.json` version to match.

### How to cut a release

1. **Update version** in `manifest.json`:
   ```json
   "version": "1.1.0"
   ```

2. **Commit the version bump**:
   ```bash
   git add manifest.json
   git commit -m "Bump version to 1.1.0"
   git push
   ```

3. **Build the release ZIP** (only extension files, no docs/logos/screenshots):
   ```bash
   cd ~/Documents/GitHub/squarestats
   zip -r ~/Desktop/squarestats-v1.1.0-chrome.zip \
     manifest.json background/ content/ icons/ lib/ popup/ utils/ \
     -x "*.DS_Store"
   ```

4. **Tag and create the GitHub release**:
   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   gh release create v1.1.0 \
     ~/Desktop/squarestats-v1.1.0-chrome.zip \
     --title "v1.1.0" \
     --notes "## Changes
   - Description of changes"
   ```

5. **Chrome Web Store update** (if published):
   - Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Select SquareStats → Package → Upload new package
   - Upload the same ZIP
   - Submit for review

### What goes in the release ZIP

Include: `manifest.json`, `background/`, `content/`, `icons/`, `lib/`, `popup/`, `utils/`

Exclude: `.git/`, `.gitignore`, `.DS_Store`, `logo/`, `screenshots/`, `README.md`, `API.md`, `AGENTS.md`

### Release notes format

Use a `## Changes` heading with bullet points. Categorize as:
- **Added** — new features
- **Fixed** — bug fixes
- **Changed** — modifications to existing behavior

## Testing

No automated tests. Manual testing checklist:

1. Reload extension in `chrome://extensions`
2. Navigate to a Squarespace site admin
3. Open popup — verify site connects and shows title/domain
4. Export with default settings — verify ZIP downloads
5. Check ZIP contents: CSVs have correct headers, no duplicate dates, summary and settings files present
6. Load `export-settings.yaml` back in — verify settings restore
7. Save as default — reopen popup, verify preset auto-loads
8. Clear default — reopen popup, verify defaults return
