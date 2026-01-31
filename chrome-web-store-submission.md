# Chrome Web Store Submission — SquareStats

**ID:** `fmakibhaeopkmdemoeemnpjohkkafamc`

---

## Store Listing

**Title:** SquareStats

**Summary:** Export Squarespace analytics data to CSV/ZIP

**Category:** Developer Tools

**Language:** English (United States)

**Homepage URL:** `https://github.com/nerveband/squarestats`

**Support URL:** `https://github.com/nerveband/squarestats/issues`

**Mature content:** No

---

## Privacy

### Single purpose description

```
Exports Squarespace website analytics (traffic, sales, geography, content, sources) to CSV files for offline analysis.
```

### Permission justifications

**activeTab:**
```
Required to communicate with the active Squarespace tab to detect if the user is logged in and to send extraction commands to the content script running on the page.
```

**downloads:**
```
Required to save the exported CSV and ZIP files to the user's local machine. The extension generates files in-browser and uses chrome.downloads to trigger the download.
```

**storage:**
```
Required to persist user preferences between sessions, including last-used date range, granularity, report selections, and per-site default presets. All data is stored locally and never transmitted.
```

**Host permission (https://*.squarespace.com/*):**
```
The extension's content scripts must run on squarespace.com to access the site's internal analytics API endpoints. The extension reads analytics data using the user's existing authenticated session. No data is sent to any external server.
```

### Remote code

**No**, I am not using remote code.

### Data usage

Check **none** of the boxes. The extension does not collect any user data.

- [x] I do not sell or transfer user data to third parties
- [x] I do not use or transfer user data for unrelated purposes
- [x] I do not use or transfer user data to determine creditworthiness

### Privacy policy URL

```
https://github.com/nerveband/squarestats/blob/main/PRIVACY.md
```

---

## Distribution

- **Payments:** Free of charge
- **Visibility:** Public
- **Regions:** All regions

---

## Test Instructions

**Username:** *(leave blank)*

**Password:** *(leave blank)*

**Additional instructions:**
```
No login credentials needed for the extension itself. To test, the reviewer must be logged in to any Squarespace site admin panel (e.g. yoursite.squarespace.com). The extension activates when visiting a squarespace.com domain and reads analytics data using the existing Squarespace session. Without an active Squarespace login, the extension will display a "Session Expired" or "Not Connected" message, which is expected behavior.
```

---

## Graphics Checklist

| Asset | Size | Status |
|-------|------|--------|
| Store icon | 128x128 px | Use `icons/icon128.png` |
| Screenshot 1 | 1280x800 or 640x400 | `screenshots/main screen.png` (resize needed) |
| Screenshot 2 | 1280x800 or 640x400 | `screenshots/export screen.png` (resize needed) |
| Small promo tile | 440x280 | Optional — not yet created |
| Marquee promo tile | 1400x560 | Optional — not yet created |

---

## Before Publishing

1. Create `PRIVACY.md` in the repo (see below)
2. Resize screenshots to 1280x800
3. Fill in all Privacy fields
4. Check all three data usage certifications
5. Click **Submit for Review**
