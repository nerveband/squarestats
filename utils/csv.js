const SqCSV = {
  BOM: '\uFEFF',

  escapeField(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  },

  buildCSV(headers, rows) {
    const lines = [headers.map(h => this.escapeField(h)).join(',')];
    for (const row of rows) {
      lines.push(row.map(v => this.escapeField(v)).join(','));
    }
    return this.BOM + lines.join('\r\n') + '\r\n';
  },

  formatDate(millis) {
    const d = new Date(millis);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  formatPct(value) {
    if (value == null) return '';
    return (value * 100).toFixed(2) + '%';
  },

  formatMoney(value) {
    if (value == null) return '0.00';
    return Number(value).toFixed(2);
  },

  // Traffic Overview: series[] with {date, values: {visits, visitors, views, bounceRate}}
  trafficOverviewToCSV(series) {
    const headers = ['Date', 'Visits', 'Unique Visitors', 'Page Views', 'Bounce Rate'];
    const rows = [];
    for (const entry of series) {
      const v = entry.values || {};
      rows.push([
        this.formatDate(entry.date),
        v.visits || 0,
        v.visitors || 0,
        v.views || 0,
        this.formatPct(v.bounceRate),
      ]);
    }
    return this.buildCSV(headers, rows);
  },

  // Traffic Sources: sources[] with {name, visits, commerce: {revenue, orders, aov, rpv, convRate}}
  trafficSourcesToCSV(sources) {
    const headers = ['Source', 'Visits', 'Revenue', 'Orders', 'AOV', 'RPV', 'Conversion Rate'];
    const rows = [];
    for (const s of sources) {
      const c = s.commerce || {};
      rows.push([
        s.name || '',
        s.visits || 0,
        this.formatMoney(c.revenue),
        c.orders || 0,
        this.formatMoney(c.aov),
        this.formatMoney(c.rpv),
        this.formatPct(c.convRate),
      ]);
    }
    return this.buildCSV(headers, rows);
  },

  // Geography: locations[] with {displayName, locationId, visits}
  geographyToCSV(locations) {
    const headers = ['Country', 'Country Code', 'Visits'];
    const rows = [];
    for (const loc of locations) {
      rows.push([
        loc.displayName || '',
        loc.locationId || '',
        loc.visits || 0,
      ]);
    }
    return this.buildCSV(headers, rows);
  },

  // Popular Content: pages[] with {page, path, views, metrics: {timeOnPage, bounceRate, exitRate}}
  popularContentToCSV(pages) {
    const headers = ['Page Title', 'Path', 'Views', 'Avg Time on Page (s)', 'Bounce Rate', 'Exit Rate'];
    const rows = [];
    for (const p of pages) {
      const m = p.metrics || {};
      rows.push([
        p.page || '',
        p.path || '',
        p.views || 0,
        m.timeOnPage != null ? (m.timeOnPage / 1000).toFixed(1) : '0.0',
        this.formatPct(m.bounceRate),
        this.formatPct(m.exitRate),
      ]);
    }
    return this.buildCSV(headers, rows);
  },

  // Sales Overview: series[] with {date, values: {revenue, orders, units, aov, rpv, convRate}}
  salesToCSV(series) {
    const headers = ['Date', 'Revenue', 'Orders', 'Units', 'AOV', 'RPV', 'Conversion Rate'];
    const rows = [];
    for (const entry of series) {
      const v = entry.values || {};
      rows.push([
        this.formatDate(entry.date),
        this.formatMoney(v.revenue),
        v.orders || 0,
        v.units || 0,
        this.formatMoney(v.aov),
        this.formatMoney(v.rpv),
        this.formatPct(v.convRate),
      ]);
    }
    return this.buildCSV(headers, rows);
  },
};
