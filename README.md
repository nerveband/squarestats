# SquareStats

![SquareStats Banner](logo/SquareStats%20Banner.png)

Export your Squarespace traffic, sales, and content analytics to CSV. All data stays in your browser.

<p align="center">
  <img src="screenshots/main%20screen.png" alt="SquareStats main screen" width="360">
  &nbsp;&nbsp;
  <img src="screenshots/export%20screen.png" alt="SquareStats export in progress" width="360">
</p>

## Install

1. Download or clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `squarestats` folder
5. Navigate to your Squarespace site admin (e.g. `yoursite.squarespace.com`)
6. Click the SquareStats icon in your toolbar

## How It Works

SquareStats reads analytics data directly from Squarespace's internal API using your existing login session. No data is sent to any external server — everything runs locally in your browser and downloads straight to your machine.

## Settings

### Date Range

Controls the time period for your export.

| Option | Description |
|--------|-------------|
| **All Time** | From the day your site was created to today |
| **Last 30 Days** | The most recent 30 days |
| **Last 90 Days** | The most recent 90 days |
| **Last Year** | The most recent 365 days |
| **Custom Range** | Pick a specific start and end date |

### Granularity

Controls how time-series data (Traffic and Sales) is grouped. This only affects reports that have a date column.

| Option | Description |
|--------|-------------|
| **Daily** | One row per day. Best for short ranges (under 90 days). |
| **Weekly** | One row per week. Useful for spotting trends over a few months. |
| **Monthly** | One row per month. Best for long ranges (6+ months or all time). |

Shorter granularity over long date ranges means more API requests and larger files. For example, exporting 2 years of daily data produces ~730 rows, while monthly produces ~24.

### Reports

Choose which analytics to export. Select one or more.

| Report | What's Included |
|--------|----------------|
| **Traffic** | Date, visits, unique visitors, page views, and bounce rate over time |
| **Sources** | Breakdown by traffic source (direct, search, social, referral) with visit counts, revenue, orders, and conversion rates |
| **Geography** | Visits by country |
| **Content** | Every page on your site with total views, average time on page, bounce rate, and exit rate |
| **Sales** | Date, revenue, orders, and average order value over time |

Selecting multiple reports bundles them into a single `.zip` file.

### Load Settings

Click the **Load Settings** button below the Export button to import an `export-settings.yaml` file. This restores the date range, granularity, and report selections from a previous export — useful for repeating the same export across different sites or time periods.

### Per-Site Presets

SquareStats can save your preferred settings for each site. After configuring your export, click **Save** to store a preset for the current site. The next time you open the popup on that site, your saved preset will be applied automatically.

- **Save** / **Update** — saves the current date range, granularity, and report selections
- **Clear** — removes the saved preset so the site reverts to default settings

Saved presets are stored locally per site and take priority over the generic last-used preferences.

## Output

Files are named `squarestats-{sitename}-{date}.zip`. Each ZIP includes:

- One CSV per selected report
- `export-summary.txt` — a human-readable receipt with site name, domain, export date, and row counts
- `export-settings.yaml` — machine-readable settings that can be loaded back into SquareStats

CSVs are UTF-8 encoded with a BOM header for Excel compatibility.

### export-settings.yaml Format

The settings file uses a simple YAML format:

```yaml
# SquareStats Export Settings
# Load this file into SquareStats to reuse these settings.

date_range:
  preset: all_time          # all_time | last_30 | last_90 | last_year | custom
  start: 2024-07-23         # actual start date used
  end: 2026-01-31           # actual end date used

granularity: daily          # daily | weekly | monthly

reports:
  traffic: true
  sources: true
  geography: true
  content: true
  sales: false
```

| Field | Description |
|-------|-------------|
| `date_range.preset` | Which date range preset was selected. One of `all_time`, `last_30`, `last_90`, `last_year`, or `custom`. |
| `date_range.start` | Start date in `YYYY-MM-DD` format. When preset is not `custom`, this reflects the computed date. |
| `date_range.end` | End date in `YYYY-MM-DD` format. |
| `granularity` | Time grouping: `daily`, `weekly`, or `monthly`. |
| `reports.*` | Boolean for each report type. `true` = included in export, `false` = excluded. |

When loading this file back into SquareStats:

- If `preset` is a recognized value (e.g. `all_time`), that preset is selected in the dropdown
- If `preset` is `custom` or unrecognized, the `start` and `end` dates are applied as a custom range
- Report checkboxes are set based on the boolean values under `reports`

### export-summary.txt Format

A plain text receipt for quick reference:

```
SquareStats Export
==================
Site:        My Site
Domain:      mysite.squarespace.com
Exported:    January 31, 2026 at 11:29 AM

Files included:
  - traffic-overview.csv    (559 rows)
  - traffic-sources.csv     (5 rows)
  - geography.csv           (83 rows)
  - popular-content.csv     (79 rows)
```

## Requirements

- Google Chrome
- Logged in to your Squarespace site admin

## Author

Made by [Ashraf Ali](https://ashrafali.net)
