(() => {
  let cancelRequested = false;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function sendProgress(type, data) {
    chrome.runtime.sendMessage({ type, ...data });
  }

  // Deduplicate time-series entries by date (last entry wins at chunk boundaries)
  // Uses local date formatting to match SqCSV.formatDate() output
  function deduplicateByDate(series) {
    const seen = new Map();
    for (const entry of series) {
      const d = new Date(entry.date);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      seen.set(dateKey, entry);
    }
    return Array.from(seen.values());
  }

  // Human-readable export receipt
  function buildExportSummary(siteName, domain, results) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const lines = [
      'SquareStats Export',
      '==================',
      `Site:        ${siteName}`,
      `Domain:      ${domain}`,
      `Exported:    ${dateStr} at ${timeStr}`,
      '',
      'Files included:',
    ];
    for (const r of results) {
      lines.push(`  - ${r.filename.padEnd(28)}(${r.rowCount} rows)`);
    }
    return lines.join('\n') + '\n';
  }

  // Machine-readable settings YAML (loadable back into extension)
  function buildExportSettings(datePreset, startMillis, endMillis, granularity, reports) {
    const fmtDate = ms => {
      const d = new Date(ms);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const reportMap = {
      traffic_overview: 'traffic',
      traffic_sources: 'sources',
      geography: 'geography',
      popular_content: 'content',
      sales_overview: 'sales',
    };
    const allReportIds = ['traffic_overview', 'traffic_sources', 'geography', 'popular_content', 'sales_overview'];

    const lines = [
      '# SquareStats Export Settings',
      '# Load this file into SquareStats to reuse these settings.',
      '',
      'date_range:',
      `  preset: ${datePreset || 'custom'}`,
      `  start: ${fmtDate(startMillis)}`,
      `  end: ${fmtDate(endMillis)}`,
      '',
      `granularity: ${granularity.toLowerCase()}`,
      '',
      'reports:',
    ];
    for (const id of allReportIds) {
      lines.push(`  ${reportMap[id]}: ${reports.includes(id)}`);
    }
    return lines.join('\n') + '\n';
  }

  async function mergeTrafficOverviewChunks(chunks, granularity, onProgress) {
    const allSeries = [];
    for (let i = 0; i < chunks.length; i++) {
      if (cancelRequested) throw new Error('CANCELLED');
      onProgress(i, chunks.length);
      const data = await SqAPI.fetchTrafficOverview(chunks[i].startMillis, chunks[i].endMillis, granularity);
      if (data && data.series) allSeries.push(...data.series);
      if (i < chunks.length - 1) await sleep(SQSTATS.RATE_LIMIT_MS);
    }
    return deduplicateByDate(allSeries);
  }

  async function mergeSalesChunks(chunks, granularity, onProgress) {
    const allSeries = [];
    for (let i = 0; i < chunks.length; i++) {
      if (cancelRequested) throw new Error('CANCELLED');
      onProgress(i, chunks.length);
      const data = await SqAPI.fetchSalesOverview(chunks[i].startMillis, chunks[i].endMillis, granularity);
      const siteSeries = data && data.seriesByChannelSourceExtension && data.seriesByChannelSourceExtension.SITE;
      if (siteSeries) allSeries.push(...siteSeries);
      if (i < chunks.length - 1) await sleep(SQSTATS.RATE_LIMIT_MS);
    }
    return deduplicateByDate(allSeries);
  }

  async function extractReport(reportId, startMillis, endMillis, granularity, chunks, onProgress) {
    switch (reportId) {
      case 'traffic_overview': {
        const series = await mergeTrafficOverviewChunks(chunks, granularity, onProgress);
        return { csv: SqCSV.trafficOverviewToCSV(series), rowCount: series.length, filename: 'traffic-overview.csv' };
      }
      case 'traffic_sources': {
        onProgress(0, 1);
        const data = await SqAPI.fetchTrafficSources(startMillis, endMillis, granularity);
        const sources = (data && data.sources) || [];
        return { csv: SqCSV.trafficSourcesToCSV(sources), rowCount: sources.length, filename: 'traffic-sources.csv' };
      }
      case 'geography': {
        onProgress(0, 1);
        const data = await SqAPI.fetchGeography(startMillis, endMillis, granularity);
        const locations = (data && data.locations) || [];
        return { csv: SqCSV.geographyToCSV(locations), rowCount: locations.length, filename: 'geography.csv' };
      }
      case 'popular_content': {
        onProgress(0, 1);
        const data = await SqAPI.fetchPopularContent(startMillis, endMillis, granularity);
        const pages = (data && data.pages) || [];
        return { csv: SqCSV.popularContentToCSV(pages), rowCount: pages.length, filename: 'popular-content.csv' };
      }
      case 'sales_overview': {
        const series = await mergeSalesChunks(chunks, granularity, onProgress);
        return { csv: SqCSV.salesToCSV(series), rowCount: series.length, filename: 'sales-overview.csv' };
      }
      default:
        throw new Error(`Unknown report: ${reportId}`);
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CHECK_STATUS') {
      const crumb = SqAPI.getCrumbToken();
      if (!crumb) {
        sendResponse({ status: 'no_auth' });
        return;
      }

      const hostname = window.location.hostname;
      const siteSlug = hostname.replace(/\.squarespace\.com$/, '');

      SqAPI.fetchSettings()
        .then(settings => {
          // settings: {websiteTitle, createdOn, ...}
          sendResponse({
            status: 'ready',
            siteTitle: settings.websiteTitle || siteSlug,
            createdMillis: settings.createdOn || null,
            siteName: siteSlug,
            domain: hostname,
          });
        })
        .catch(err => {
          if (err.message.startsWith('AUTH_ERROR')) {
            sendResponse({ status: 'auth_error', error: err.message });
          } else {
            sendResponse({ status: 'error', error: err.message });
          }
        });
      return true;
    }

    if (message.type === 'EXTRACT') {
      cancelRequested = false;
      const { reports, startMillis, endMillis, granularity, siteName, datePreset } = message;
      const chunks = SqDates.chunkDateRange(
        new Date(startMillis), new Date(endMillis), SQSTATS.CHUNK_SIZE_DAYS
      );

      (async () => {
        const results = [];
        let completed = 0;

        for (const reportId of reports) {
          if (cancelRequested) {
            sendProgress('EXTRACT_CANCELLED', { results });
            sendResponse({ status: 'cancelled', results });
            return;
          }

          sendProgress('REPORT_START', { reportId, completed, total: reports.length });

          try {
            const result = await extractReport(reportId, startMillis, endMillis, granularity, chunks, (chunk, totalChunks) => {
              sendProgress('CHUNK_PROGRESS', { reportId, chunk, totalChunks });
            });
            results.push(result);
            sendProgress('REPORT_DONE', { reportId, rowCount: result.rowCount });
          } catch (err) {
            if (err.message === 'CANCELLED') {
              sendProgress('EXTRACT_CANCELLED', { results });
              sendResponse({ status: 'cancelled', results });
              return;
            }
            if (err.message.startsWith('NOT_FOUND')) {
              sendProgress('REPORT_SKIPPED', { reportId, reason: err.message });
              continue;
            }
            if (err.message.startsWith('AUTH_ERROR')) {
              sendProgress('AUTH_ERROR', { results });
              sendResponse({ status: 'auth_error', results, error: err.message });
              return;
            }
            console.error(`SquareStats: ${reportId} error:`, err);
            sendProgress('REPORT_ERROR', { reportId, error: err.message });
          }
          completed++;
        }

        // Build export files
        const domain = window.location.hostname;
        const exportSummary = buildExportSummary(siteName, domain, results);
        const exportSettings = buildExportSettings(datePreset, startMillis, endMillis, granularity, reports);

        // Single file or ZIP
        const dateStr = SqDates.formatDateShort(new Date());
        if (results.length >= 1) {
          const files = results.map(r => ({ name: r.filename, content: r.csv }));
          files.push({ name: 'export-summary.txt', content: exportSummary });
          files.push({ name: 'export-settings.yaml', content: exportSettings });
          chrome.runtime.sendMessage({
            type: 'DOWNLOAD_ZIP',
            files,
            zipName: `squarestats-${siteName}-${dateStr}.zip`,
          });
        }

        sendProgress('EXTRACT_COMPLETE', {
          results: results.map(r => ({ filename: r.filename, rowCount: r.rowCount })),
        });
        sendResponse({ status: 'complete', results: results.map(r => ({ filename: r.filename, rowCount: r.rowCount })) });
      })();

      return true;
    }

    if (message.type === 'CANCEL_EXTRACT') {
      cancelRequested = true;
      sendResponse({ status: 'cancelling' });
    }
  });
})();
