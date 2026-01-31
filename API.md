# Squarespace Analytics API Reference

> **Last verified:** January 31, 2026
> **Base URL:** `https://{site}.squarespace.com/api/census-frontend/1/`
> **Authentication:** Session cookie + CSRF token from `crumb` cookie
> **Required header:** `x-csrf-token: {crumb cookie value}`

All endpoints require an active Squarespace admin session. The `crumb` cookie is set automatically when you log in to the Squarespace admin panel.

---

## GET `/settings`

Returns site metadata and available analytics features.

**Parameters:** None

**Response:**
```json
{
  "websiteTitle": "Tanwir Institute",
  "createdOn": 1721765189109,
  "storeCurrency": "USD",
  "currentUtcOffsetMillis": -18000000,
  "features": [
    { "feature": "trafficOverview", "qualifiers": [] },
    { "feature": "salesOverview", "qualifiers": ["addPointOfSale"] },
    { "feature": "popularContent", "qualifiers": [] },
    { "feature": "geography", "qualifiers": [] },
    { "feature": "trafficSources", "qualifiers": ["fullPaidDetails", "addCommerce"] }
  ],
  "salesChannelSourceExtensions": [
    { "id": "ALL_CHANNELS", "displayName": "All Channels" },
    { "id": "SITE", "displayName": "Website" },
    { "id": "POINT_OF_SALE", "displayName": "POS" }
  ]
}
```

**Key fields:**
| Field | Type | Description |
|-------|------|-------------|
| `websiteTitle` | string | Site display name |
| `createdOn` | number | Site creation timestamp (ms since epoch) — used for "All Time" date range |
| `storeCurrency` | string | Currency code for sales data |
| `features` | array | Analytics features available on this plan |

---

## GET `/traffic-overview`

Returns time-series traffic data with visit/view/bounce metrics.

**Parameters:**
| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `granularity` | string | `DAILY` | `DAILY`, `WEEKLY`, or `MONTHLY` |
| `startMillis` | number | `1767312000000` | Start of range (ms since epoch) |
| `endMillis` | number | `1769904000000` | End of range (ms since epoch) |

**Response:**
```json
{
  "granularity": "DAILY",
  "validGranularities": ["WEEKLY"],
  "dateRange": { "startMillis": 1767312000000, "endMillis": 1769904000000 },
  "totals": {
    "visits": 1161,
    "visitors": 950,
    "views": 2404,
    "bounceRate": 0.5639
  },
  "series": [
    {
      "date": 1767312000000,
      "values": {
        "visits": 30,
        "visitors": 25,
        "views": 71,
        "bounceRate": 0.6,
        "visitsAnomaly": {
          "isAnomaly": false,
          "upperBound": 59,
          "lowerBound": 0,
          "metricType": "VISITS"
        }
      }
    }
  ],
  "top": {
    "visits": {
      "device": { "Mobile": 797, "Desktop": 312, "Tablet": 1 },
      "source": { "Direct": 823, "Google": 241, "Instagram": 58 },
      "os": { "iOS": 688, "macOS": 157, "Android": 109, "Windows": 98 },
      "browser": { "Mobile Safari": 536, "Chrome": 241, "Chrome Mobile": 155 }
    }
  }
}
```

**Key fields in `series[]`:**
| Field | Type | Description |
|-------|------|-------------|
| `date` | number | Day/week/month timestamp (ms since epoch) |
| `values.visits` | number | Total visits |
| `values.visitors` | number | Unique visitors |
| `values.views` | number | Page views |
| `values.bounceRate` | number | Bounce rate as decimal (0.56 = 56%) |

**Notes:**
- `validGranularities` tells you which granularities the API recommends for the given date range
- `top` contains breakdowns by device, source, OS, and browser (aggregate for the entire range, not per-day)

---

## GET `/traffic-sources/overview`

Returns traffic sources with commerce conversion data.

**Parameters:**
| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `limit` | number | `50` | Max sources to return |
| `isAscending` | boolean | `false` | Sort direction |
| `granularity` | string | `DAILY` | Granularity for time series |
| `startMillis` | number | `1767312000000` | Start of range |
| `endMillis` | number | `1769904000000` | End of range |

**Response:**
```json
{
  "sources": [
    {
      "name": "Direct",
      "key": "Direct",
      "isParent": false,
      "visits": 833,
      "commerce": {
        "revenue": 12265.0,
        "orders": 69,
        "convertedVisits": 67,
        "aov": 177.75,
        "rpv": 14.72,
        "convRate": 0.0804
      }
    },
    {
      "name": "Search",
      "key": "Search",
      "isParent": true,
      "visits": 253,
      "commerce": { "revenue": 206.0, "orders": 2, "aov": 103.00, "rpv": 0.81, "convRate": 0.0079 }
    }
  ],
  "timeSeries": [
    {
      "localMillis": 1767312000000,
      "timestamp": "2026-01-02 00:00:00",
      "sources": [
        { "name": "Direct", "visits": 17, "commerce": { "revenue": 0.0, "orders": 0 } },
        { "name": "Search", "visits": 10, "commerce": { "revenue": 0.0, "orders": 0 } }
      ]
    }
  ]
}
```

**Key fields in `sources[]`:**
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Source name (Direct, Search, Social, Referral, Email) |
| `visits` | number | Total visits from this source |
| `isParent` | boolean | Whether this source has sub-sources (e.g., Search → Google, Bing) |
| `commerce.revenue` | number | Total revenue attributed to this source |
| `commerce.orders` | number | Number of orders |
| `commerce.aov` | number | Average order value |
| `commerce.rpv` | number | Revenue per visit |
| `commerce.convRate` | number | Conversion rate as decimal |

**Notes:**
- Top-level `sources[]` contains aggregate data for the full range
- `timeSeries[]` contains per-day breakdown (SquareStats uses the aggregate `sources[]`)

---

## GET `/geography/metrics/countries`

Returns visit counts by country.

**Parameters:**
| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `isAscending` | boolean | `false` | Sort direction |
| `granularity` | string | `DAILY` | Granularity |
| `startMillis` | number | `1767312000000` | Start of range |
| `endMillis` | number | `1769904000000` | End of range |

**Response:**
```json
{
  "totals": { "visits": 1109 },
  "locations": [
    {
      "displayName": "United States",
      "locationId": "US",
      "latitude": 0.0,
      "longitude": 0.0,
      "visits": 1019
    },
    {
      "displayName": "Canada",
      "locationId": "CA",
      "latitude": 0.0,
      "longitude": 0.0,
      "visits": 9
    }
  ]
}
```

**Key fields in `locations[]`:**
| Field | Type | Description |
|-------|------|-------------|
| `displayName` | string | Country name |
| `locationId` | string | ISO 3166-1 alpha-2 country code |
| `visits` | number | Visit count |

**Notes:**
- `latitude`/`longitude` are always `0.0` at the country level
- Entries with empty `locationId` are "Unknown" locations

---

## GET `/popular-content/pages`

Returns page-level analytics sorted by views.

**Parameters:**
| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `limit` | number | `100` | Max pages to return |
| `sortBy` | string | `views` | Sort field |
| `isAscending` | boolean | `false` | Sort direction |
| `granularity` | string | `DAILY` | Granularity |
| `startMillis` | number | `1767312000000` | Start of range |
| `endMillis` | number | `1769904000000` | End of range |

**Response:**
```json
{
  "totalViews": 2404,
  "pages": [
    {
      "page": "Home",
      "path": "/",
      "views": 662,
      "metrics": {
        "views": 662,
        "timeOnPage": 51765,
        "bounceRate": 0.4328,
        "exitRate": 0.4063
      }
    },
    {
      "page": "Prophetic Guidance",
      "path": "/propheticguidance",
      "views": 308,
      "metrics": {
        "timeOnPage": 122871,
        "bounceRate": 0.7266,
        "exitRate": 0.4708
      }
    }
  ],
  "aggregateMetrics": {
    "views": 2404,
    "timeOnPage": 85855,
    "bounceRate": 0.5639,
    "exitRate": 0.4368
  }
}
```

**Key fields in `pages[]`:**
| Field | Type | Description |
|-------|------|-------------|
| `page` | string | Page title as set in Squarespace |
| `path` | string | URL path |
| `views` | number | Page view count |
| `metrics.timeOnPage` | number | Average time on page in **milliseconds** |
| `metrics.bounceRate` | number | Bounce rate as decimal |
| `metrics.exitRate` | number | Exit rate as decimal |

**Notes:**
- `metrics.timeOnPage` is in milliseconds — divide by 1000 for seconds
- Also returns `topContentByViews[]` (top 8 pages) and `aggregateMetrics` for site-wide averages
- Response also supports comparison data via `comparisonCode` param (`MoM`, `YoY`)

---

## GET `/sales-overview`

Returns time-series sales/commerce data.

**Parameters:**
| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `salesChannelSourceExtensionIds` | string | `SITE` | Sales channel filter (`SITE`, `POINT_OF_SALE`, `ALL_CHANNELS`) |
| `granularity` | string | `DAILY` | `DAILY`, `WEEKLY`, or `MONTHLY` |
| `startMillis` | number | `1767312000000` | Start of range |
| `endMillis` | number | `1769904000000` | End of range |

**Response:**
```json
{
  "granularity": "DAILY",
  "validGranularities": ["WEEKLY"],
  "totals": {
    "revenue": 15146.5,
    "orders": 94,
    "units": 101,
    "visits": 1161,
    "convertedVisits": 70,
    "convRate": 0.0603,
    "aov": 161.13,
    "rpv": 10.75
  },
  "seriesByChannelSourceExtension": {
    "SITE": [
      {
        "date": 1767312000000,
        "values": {
          "revenue": 900.0,
          "orders": 6,
          "units": 6,
          "visits": 30,
          "convertedVisits": 0,
          "convRate": 0.0,
          "aov": 150.00,
          "rpv": 0.00
        }
      }
    ]
  },
  "top": {
    "revenue": {
      "device": { "Mobile": 10417.0, "Desktop": 2068.0 },
      "source": { "Direct": 14926.5, "Google": 206.0 },
      "product": { "Prophetic Guidance": 9310.0, "Associates Program": 2437.5 }
    },
    "orders": {
      "product": { "Prophetic Guidance": 53, "Associates Program": 19 }
    }
  }
}
```

**Key fields in `seriesByChannelSourceExtension.SITE[]`:**
| Field | Type | Description |
|-------|------|-------------|
| `date` | number | Day/week/month timestamp (ms since epoch) |
| `values.revenue` | number | Revenue for this period |
| `values.orders` | number | Number of orders |
| `values.units` | number | Number of units sold |
| `values.aov` | number | Average order value |
| `values.rpv` | number | Revenue per visit |
| `values.convRate` | number | Conversion rate as decimal |

**Notes:**
- Data is nested under the channel key (e.g., `SITE`) inside `seriesByChannelSourceExtension`
- `top` contains breakdowns by device, source, and product (aggregate for full range)
- Also has a `/sales-overview/totals` endpoint for comparison period totals

---

## Common Patterns

### Date Handling
- All timestamps are **milliseconds since epoch** (Unix time * 1000)
- Dates represent the start of a period (day/week/month) in the site's local timezone
- The site's UTC offset is available from the `settings` endpoint (`currentUtcOffsetMillis`)

### Rate & Decimal Values
- Rates (bounce, exit, conversion) are **decimals**, not percentages: `0.56` = 56%
- Revenue values are in the site's `storeCurrency` (from settings)
- `timeOnPage` is in **milliseconds**

### Chunking Large Date Ranges
For daily granularity over long periods, Squarespace may recommend a coarser granularity via `validGranularities`. SquareStats chunks large ranges into 30-day windows and merges results.

### Error Codes
| Status | Meaning |
|--------|---------|
| 401/403 | Session expired — user needs to log in again |
| 404 | Feature not available on this site/plan |

### CSRF Token
The `crumb` cookie is set by Squarespace on login and must be sent as the `x-csrf-token` header on every API request. It can be read from `document.cookie` in a content script running on `*.squarespace.com`.
