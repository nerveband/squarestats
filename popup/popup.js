(() => {
  // DOM elements
  const states = {
    notSquarespace: document.getElementById('state-not-squarespace'),
    authError: document.getElementById('state-auth-error'),
    loading: document.getElementById('state-loading'),
    main: document.getElementById('state-main'),
    extracting: document.getElementById('state-extracting'),
    complete: document.getElementById('state-complete'),
  };

  const els = {
    siteTitle: document.getElementById('site-title'),
    siteDomain: document.getElementById('site-domain'),
    datePreset: document.getElementById('date-preset'),
    customDates: document.getElementById('custom-dates'),
    dateStart: document.getElementById('date-start'),
    dateEnd: document.getElementById('date-end'),
    granularityHint: document.getElementById('granularity-hint'),
    previewText: document.getElementById('preview-text'),
    btnExtract: document.getElementById('btn-extract'),
    btnCancel: document.getElementById('btn-cancel'),
    btnAgain: document.getElementById('btn-again'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    reportChecklist: document.getElementById('report-checklist'),
    completeSummary: document.getElementById('complete-summary'),
    completeFilename: document.getElementById('complete-filename'),
    presetRow: document.getElementById('preset-row'),
    presetStatus: document.getElementById('preset-status'),
    btnPresetSave: document.getElementById('btn-preset-save'),
    btnPresetClear: document.getElementById('btn-preset-clear'),
  };

  let siteInfo = null;
  let presets = [];
  let sitePresetLoaded = false;

  // State management
  function showState(name) {
    for (const [key, el] of Object.entries(states)) {
      el.style.display = key === name ? 'block' : 'none';
    }
  }

  // Get selected reports
  function getSelectedReports() {
    return Array.from(document.querySelectorAll('.report-list input:checked')).map(cb => cb.value);
  }

  // Get selected granularity
  function getGranularity() {
    return document.querySelector('input[name="granularity"]:checked').value;
  }

  // Get date range
  function getDateRange() {
    const presetId = els.datePreset.value;
    if (presetId === 'custom') {
      const start = els.dateStart.value ? new Date(els.dateStart.value) : null;
      const end = els.dateEnd.value ? new Date(els.dateEnd.value) : null;
      if (!start || !end) return null;
      return { start, end: new Date(end.getTime() + 86400000 - 1) }; // end of day
    }
    const preset = presets.find(p => p.id === presetId);
    return preset ? { start: preset.start, end: preset.end } : null;
  }

  // Update preview
  function updatePreview() {
    const reports = getSelectedReports();
    const range = getDateRange();

    if (!reports.length || !range) {
      els.previewText.textContent = 'Select at least one report and date range.';
      els.btnExtract.disabled = true;
      return;
    }

    els.btnExtract.disabled = false;
    const days = Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24));
    const granularity = getGranularity();
    const chunks = Math.ceil(days / 30);
    const timeSeriesReports = reports.filter(r => r === 'traffic_overview' || r === 'sales_overview').length;
    const singleReports = reports.length - timeSeriesReports;
    const apiCalls = (timeSeriesReports * chunks) + singleReports;

    const siteName = siteInfo ? siteInfo.siteName : 'site';
    const dateStr = new Date().toISOString().split('T')[0];
    const output = `squarestats-${siteName}-${dateStr}.zip`;

    els.previewText.textContent = `${reports.length} report${reports.length > 1 ? 's' : ''}, ${days} days (${granularity.toLowerCase()}), ~${apiCalls} API request${apiCalls > 1 ? 's' : ''} → ${output}`;

    els.granularityHint.style.display = 'none';
  }

  function suggestGranularity(start, end) {
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (days > 365) return 'MONTHLY';
    if (days > 90) return 'WEEKLY';
    return 'DAILY';
  }

  // Populate date presets
  function populatePresets(createdMillis) {
    const now = new Date();

    presets = [
      { id: 'last_30', label: 'Last 30 Days', start: daysAgo(30), end: endOfDay(now) },
      { id: 'last_90', label: 'Last 90 Days', start: daysAgo(90), end: endOfDay(now) },
      { id: 'last_year', label: 'Last Year', start: daysAgo(365), end: endOfDay(now) },
    ];

    if (createdMillis) {
      presets.unshift({
        id: 'all_time',
        label: 'All Time',
        start: startOfDay(new Date(createdMillis)),
        end: endOfDay(now),
      });
    }

    presets.push({ id: 'custom', label: 'Custom Range', start: null, end: null });

    els.datePreset.innerHTML = '';
    for (const preset of presets) {
      const opt = document.createElement('option');
      opt.value = preset.id;
      opt.textContent = preset.label;
      els.datePreset.appendChild(opt);
    }

    // Default to Last 30 Days
    els.datePreset.value = 'last_30';
  }

  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function startOfDay(d) {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
  }

  function endOfDay(d) {
    const r = new Date(d);
    r.setHours(23, 59, 59, 999);
    return r;
  }

  // Report labels
  const REPORT_LABELS = {
    traffic_overview: 'Traffic Overview',
    traffic_sources: 'Traffic Sources',
    geography: 'Geography',
    popular_content: 'Popular Content',
    sales_overview: 'Sales Overview',
  };

  // Build extraction checklist
  function buildChecklist(reports) {
    els.reportChecklist.innerHTML = '';
    for (const reportId of reports) {
      const item = document.createElement('div');
      item.className = 'checklist-item';
      item.dataset.report = reportId;
      item.innerHTML = `
        <span class="checklist-icon pending">○</span>
        <span class="checklist-label">${REPORT_LABELS[reportId] || reportId}</span>
        <span class="checklist-detail"></span>
      `;
      els.reportChecklist.appendChild(item);
    }
  }

  function updateChecklistItem(reportId, status, detail = '') {
    const item = els.reportChecklist.querySelector(`[data-report="${reportId}"]`);
    if (!item) return;
    const icon = item.querySelector('.checklist-icon');
    const label = item.querySelector('.checklist-label');
    const detailEl = item.querySelector('.checklist-detail');

    icon.className = 'checklist-icon ' + status;
    label.className = 'checklist-label' + (status === 'active' ? ' active' : '');

    const icons = { pending: '○', active: '◉', done: '✓', error: '✗', skipped: '–' };
    icon.textContent = icons[status] || '○';

    if (detail) detailEl.textContent = detail;
  }

  // Event listeners
  els.datePreset.addEventListener('change', () => {
    els.customDates.style.display = els.datePreset.value === 'custom' ? 'flex' : 'none';
    updatePreview();
  });

  els.dateStart.addEventListener('change', updatePreview);
  els.dateEnd.addEventListener('change', updatePreview);

  document.querySelectorAll('input[name="granularity"]').forEach(radio => {
    radio.addEventListener('change', updatePreview);
  });

  document.querySelectorAll('.report-list input').forEach(cb => {
    cb.addEventListener('change', updatePreview);
  });

  // Load YAML settings
  const yamlInput = document.getElementById('yaml-input');
  const btnLoadYaml = document.getElementById('btn-load-yaml');

  btnLoadYaml.addEventListener('click', (e) => {
    e.preventDefault();
    yamlInput.click();
  });

  yamlInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      applyYamlSettings(evt.target.result);
      yamlInput.value = '';
    };
    reader.readAsText(file);
  });

  function applyYamlSettings(text) {
    const lines = text.split('\n');
    let granularity = null;
    let datePreset = null;
    let dateStart = null;
    let dateEnd = null;
    const reportFiles = [];
    const reportBooleans = {};
    let inReports = false;
    let inDateRange = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed) continue;

      if (trimmed.startsWith('granularity:')) {
        granularity = trimmed.split(':')[1].trim().replace(/#.*$/, '').trim().toUpperCase();
        inReports = false;
        inDateRange = false;
      } else if (trimmed === 'date_range:') {
        inDateRange = true;
        inReports = false;
      } else if (trimmed === 'reports:') {
        inReports = true;
        inDateRange = false;
      } else if (inDateRange && trimmed.startsWith('preset:')) {
        datePreset = trimmed.split(':')[1].trim().replace(/#.*$/, '').trim();
      } else if (inDateRange && trimmed.startsWith('start:')) {
        dateStart = trimmed.split(':').slice(1).join(':').trim().replace(/#.*$/, '').trim();
      } else if (inDateRange && trimmed.startsWith('end:')) {
        dateEnd = trimmed.split(':').slice(1).join(':').trim().replace(/#.*$/, '').trim();
      } else if (inReports && trimmed.startsWith('- file:')) {
        // Legacy format: - file: traffic-overview.csv
        reportFiles.push(trimmed.replace('- file:', '').trim());
      } else if (inReports && trimmed.includes(':')) {
        // New format: traffic: true
        const [key, val] = trimmed.split(':').map(s => s.trim().replace(/#.*$/, '').trim());
        if (key && val) reportBooleans[key] = val === 'true';
      } else if (trimmed && !trimmed.startsWith('-') && trimmed.includes(':') && !line.startsWith(' ') && !line.startsWith('\t')) {
        inReports = false;
        inDateRange = false;
      }
    }

    // Map filenames to report IDs (legacy format)
    const fileToReport = {
      'traffic-overview.csv': 'traffic_overview',
      'traffic-sources.csv': 'traffic_sources',
      'geography.csv': 'geography',
      'popular-content.csv': 'popular_content',
      'sales-overview.csv': 'sales_overview',
    };

    // Map boolean keys to report IDs (new format)
    const boolToReport = {
      traffic: 'traffic_overview',
      sources: 'traffic_sources',
      geography: 'geography',
      content: 'popular_content',
      sales: 'sales_overview',
    };

    // Prefer new boolean format, fall back to legacy file list
    let reportIds;
    if (Object.keys(reportBooleans).length > 0) {
      reportIds = Object.entries(reportBooleans)
        .filter(([, enabled]) => enabled)
        .map(([key]) => boolToReport[key])
        .filter(Boolean);
    } else {
      reportIds = reportFiles.map(f => fileToReport[f]).filter(Boolean);
    }

    // Apply granularity
    if (granularity) {
      const radio = document.querySelector(`input[name="granularity"][value="${granularity}"]`);
      if (radio) radio.checked = true;
    }

    // Apply date range: use preset if available, fall back to custom
    if (datePreset && datePreset !== 'custom' && [...els.datePreset.options].some(o => o.value === datePreset)) {
      els.datePreset.value = datePreset;
      els.customDates.style.display = 'none';
    } else if (dateStart && dateEnd) {
      els.datePreset.value = 'custom';
      els.customDates.style.display = 'flex';
      els.dateStart.value = dateStart;
      els.dateEnd.value = dateEnd;
    }

    // Apply reports
    if (reportIds.length) {
      document.querySelectorAll('.report-list input').forEach(cb => {
        cb.checked = reportIds.includes(cb.value);
      });
    }

    updatePreview();
  }

  // ─── Per-site presets ───

  function getPresetKey() {
    if (!siteInfo || !siteInfo.siteName) return null;
    return `preset_${siteInfo.siteName}`;
  }

  function getCurrentSettings() {
    return {
      datePreset: els.datePreset.value,
      dateStart: els.dateStart.value || null,
      dateEnd: els.dateEnd.value || null,
      granularity: getGranularity(),
      reports: getSelectedReports(),
    };
  }

  function applyPreset(preset) {
    if (preset.datePreset && [...els.datePreset.options].some(o => o.value === preset.datePreset)) {
      els.datePreset.value = preset.datePreset;
      els.customDates.style.display = preset.datePreset === 'custom' ? 'flex' : 'none';
    }
    if (preset.datePreset === 'custom') {
      if (preset.dateStart) els.dateStart.value = preset.dateStart;
      if (preset.dateEnd) els.dateEnd.value = preset.dateEnd;
    }
    if (preset.granularity) {
      const radio = document.querySelector(`input[name="granularity"][value="${preset.granularity}"]`);
      if (radio) radio.checked = true;
    }
    if (preset.reports && preset.reports.length) {
      document.querySelectorAll('.report-list input').forEach(cb => {
        cb.checked = preset.reports.includes(cb.value);
      });
    }
    updatePreview();
  }

  function showPresetRow(hasSavedPreset) {
    els.presetRow.style.display = 'flex';
    const sep = els.presetRow.querySelector('.preset-sep');
    if (hasSavedPreset) {
      els.presetStatus.textContent = 'Default loaded';
      els.btnPresetSave.textContent = 'Update';
      els.btnPresetClear.style.display = '';
      if (sep) sep.style.display = '';
    } else {
      els.presetStatus.textContent = '';
      els.btnPresetSave.textContent = 'Save as default';
      els.btnPresetClear.style.display = 'none';
      if (sep) sep.style.display = 'none';
    }
  }

  els.btnPresetSave.addEventListener('click', () => {
    const key = getPresetKey();
    if (!key) return;
    chrome.storage.local.set({ [key]: getCurrentSettings() }, () => {
      sitePresetLoaded = true;
      showPresetRow(true);
    });
  });

  els.btnPresetClear.addEventListener('click', () => {
    const key = getPresetKey();
    if (!key) return;
    chrome.storage.local.remove(key, () => {
      sitePresetLoaded = false;
      showPresetRow(false);
    });
  });

  // Extract button
  els.btnExtract.addEventListener('click', async () => {
    const reports = getSelectedReports();
    const range = getDateRange();
    const granularity = getGranularity();

    if (!reports.length || !range) return;

    // Save preferences
    chrome.storage.local.set({
      lastPreset: els.datePreset.value,
      lastGranularity: granularity,
      lastReports: reports,
    });

    showState('extracting');
    buildChecklist(reports);
    els.progressFill.style.width = '0%';
    els.progressText.textContent = 'Starting extraction...';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, {
      type: 'EXTRACT',
      reports,
      startMillis: range.start.getTime(),
      endMillis: range.end.getTime(),
      granularity,
      siteName: siteInfo ? siteInfo.siteName : 'site',
      datePreset: els.datePreset.value,
    });
  });

  // Cancel button
  els.btnCancel.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { type: 'CANCEL_EXTRACT' });
    els.progressText.textContent = 'Cancelling...';
  });

  // Extract Again button
  els.btnAgain.addEventListener('click', () => {
    showState('main');
    updatePreview();
  });

  // Listen for progress messages from content script (via service worker)
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'REPORT_START') {
      updateChecklistItem(message.reportId, 'active');
      const pct = Math.round((message.completed / message.total) * 100);
      els.progressFill.style.width = pct + '%';
      els.progressText.textContent = `Extracting ${REPORT_LABELS[message.reportId] || message.reportId}...`;
    }

    if (message.type === 'CHUNK_PROGRESS') {
      const label = REPORT_LABELS[message.reportId] || message.reportId;
      updateChecklistItem(message.reportId, 'active', `chunk ${message.chunk + 1}/${message.totalChunks}`);
    }

    if (message.type === 'REPORT_DONE') {
      updateChecklistItem(message.reportId, 'done', `${message.rowCount} rows`);
    }

    if (message.type === 'REPORT_SKIPPED') {
      updateChecklistItem(message.reportId, 'skipped', 'not available');
    }

    if (message.type === 'REPORT_ERROR') {
      updateChecklistItem(message.reportId, 'error', message.error || 'failed');
    }

    if (message.type === 'EXTRACT_COMPLETE') {
      showState('complete');
      let html = '';
      for (const r of message.results) {
        html += `<div class="row"><span>${r.filename}</span><span>${r.rowCount} rows</span></div>`;
      }
      els.completeSummary.innerHTML = html;
      const siteName = siteInfo ? siteInfo.siteName : 'site';
      const dateStr = new Date().toISOString().split('T')[0];
      els.completeFilename.textContent = `squarestats-${siteName}-${dateStr}.zip`;
    }

    if (message.type === 'EXTRACT_CANCELLED') {
      showState('main');
      updatePreview();
    }

    if (message.type === 'AUTH_ERROR') {
      showState('authError');
    }
  });

  // Initialize
  async function init() {
    showState('loading');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || !tab.url.includes('squarespace.com')) {
      showState('notSquarespace');
      return;
    }

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'CHECK_STATUS' });

      if (!response || response.status === 'no_auth' || response.status === 'auth_error') {
        showState('authError');
        return;
      }

      if (response.status === 'error') {
        showState('authError');
        return;
      }

      siteInfo = response;
      els.siteTitle.textContent = response.siteTitle;
      els.siteDomain.textContent = response.domain || '';
      document.getElementById('header-site').style.display = '';
      populatePresets(response.createdMillis);

      // Check for per-site preset first, then fall back to generic prefs
      const presetKey = `preset_${response.siteName}`;
      chrome.storage.local.get([presetKey, 'lastPreset', 'lastGranularity', 'lastReports'], (stored) => {
        const sitePreset = stored[presetKey];
        if (sitePreset) {
          applyPreset(sitePreset);
          sitePresetLoaded = true;
          showPresetRow(true);
        } else {
          // Fall back to generic last-used prefs
          if (stored.lastPreset && [...els.datePreset.options].some(o => o.value === stored.lastPreset)) {
            els.datePreset.value = stored.lastPreset;
            if (stored.lastPreset === 'custom') {
              els.customDates.style.display = 'flex';
            }
          }
          if (stored.lastGranularity) {
            const radio = document.querySelector(`input[name="granularity"][value="${stored.lastGranularity}"]`);
            if (radio) radio.checked = true;
          }
          if (stored.lastReports) {
            document.querySelectorAll('.report-list input').forEach(cb => {
              cb.checked = stored.lastReports.includes(cb.value);
            });
          }
          showPresetRow(false);
          updatePreview();
        }
      });

      showState('main');
    } catch (err) {
      // Content script not injected yet - might need a page reload
      showState('notSquarespace');
    }
  }

  init();
})();
