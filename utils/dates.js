const SqDates = {
  now() {
    return new Date();
  },

  startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  },

  daysAgo(n) {
    const d = this.now();
    d.setDate(d.getDate() - n);
    return this.startOfDay(d);
  },

  daysBetween(start, end) {
    const ms = end.getTime() - start.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  },

  getPresets(siteCreatedMillis) {
    const now = this.now();
    const presets = [
      { id: 'last_30', label: 'Last 30 Days', start: this.daysAgo(30), end: this.endOfDay(now) },
      { id: 'last_90', label: 'Last 90 Days', start: this.daysAgo(90), end: this.endOfDay(now) },
      { id: 'last_year', label: 'Last Year', start: this.daysAgo(365), end: this.endOfDay(now) },
    ];
    if (siteCreatedMillis) {
      presets.unshift({
        id: 'all_time',
        label: 'All Time',
        start: this.startOfDay(new Date(siteCreatedMillis)),
        end: this.endOfDay(now),
      });
    }
    presets.push({ id: 'custom', label: 'Custom Range', start: null, end: null });
    return presets;
  },

  suggestGranularity(startDate, endDate) {
    const days = this.daysBetween(startDate, endDate);
    if (days > 365) return SQSTATS.GRANULARITY.MONTHLY;
    if (days > 90) return SQSTATS.GRANULARITY.WEEKLY;
    return SQSTATS.GRANULARITY.DAILY;
  },

  chunkDateRange(startDate, endDate, chunkDays) {
    const chunks = [];
    let current = new Date(startDate);
    while (current < endDate) {
      const chunkEnd = new Date(current);
      chunkEnd.setDate(chunkEnd.getDate() + chunkDays - 1);
      const actualEnd = chunkEnd > endDate ? new Date(endDate) : this.endOfDay(chunkEnd);
      chunks.push({
        startMillis: current.getTime(),
        endMillis: actualEnd.getTime(),
      });
      current = new Date(chunkEnd);
      current.setDate(current.getDate() + 1);
      current = this.startOfDay(current);
    }
    return chunks;
  },

  formatDate(date) {
    return date.toISOString().split('T')[0];
  },

  formatDateShort(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },
};
