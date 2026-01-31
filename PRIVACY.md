# Privacy Policy — SquareStats

**Last updated:** January 31, 2026

## Data Collection

SquareStats does not collect, store, or transmit any personal data or analytics data to external servers. The extension operates entirely within your browser.

## How It Works

SquareStats reads analytics data from Squarespace's internal API using your existing authenticated session on squarespace.com. The data is processed locally in your browser and exported directly to your machine as CSV files. No data passes through any intermediary server.

## Local Storage

The extension stores the following data locally on your device using Chrome's storage API:

- **User preferences:** Last-used date range, granularity, and report selections
- **Per-site presets:** Saved default export settings for individual Squarespace sites

This data is stored only on your device and is never transmitted externally.

## Permissions

| Permission | Purpose |
|------------|---------|
| `activeTab` | Communicate with the Squarespace tab to detect login status and run extraction |
| `downloads` | Save exported CSV/ZIP files to your machine |
| `storage` | Persist user preferences and per-site presets locally |
| `host_permissions (squarespace.com)` | Access Squarespace's analytics API using your existing session |

## Third Parties

SquareStats does not share data with any third parties. There are no analytics, tracking, or telemetry services embedded in the extension.

## Contact

For questions about this privacy policy, open an issue at [github.com/nerveband/squarestats](https://github.com/nerveband/squarestats/issues).
