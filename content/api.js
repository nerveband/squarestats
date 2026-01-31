const SqAPI = {
  getCrumbToken() {
    const match = document.cookie.match(/(?:^|;\s*)crumb=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  },

  async apiFetch(endpoint, params = {}) {
    const crumb = this.getCrumbToken();
    if (!crumb) throw new Error('AUTH_ERROR: No CSRF token found. Please log in to Squarespace.');

    const url = new URL(SQSTATS.API_BASE + endpoint, window.location.origin);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'x-csrf-token': crumb,
        'Accept': 'application/json',
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('AUTH_ERROR: Session expired. Please log in and retry.');
    }
    if (response.status === 404) {
      throw new Error('NOT_FOUND: This report is not available for your site.');
    }
    if (!response.ok) {
      throw new Error(`API_ERROR: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  async fetchSettings() {
    return this.apiFetch(SQSTATS.ENDPOINTS.SETTINGS);
  },

  async fetchTrafficOverview(startMillis, endMillis, granularity) {
    return this.apiFetch(SQSTATS.ENDPOINTS.TRAFFIC_OVERVIEW, {
      granularity,
      startMillis,
      endMillis,
    });
  },

  async fetchTrafficSources(startMillis, endMillis, granularity) {
    return this.apiFetch(SQSTATS.ENDPOINTS.TRAFFIC_SOURCES, {
      limit: SQSTATS.TRAFFIC_SOURCES_LIMIT,
      isAscending: false,
      granularity,
      startMillis,
      endMillis,
    });
  },

  async fetchGeography(startMillis, endMillis, granularity) {
    return this.apiFetch(SQSTATS.ENDPOINTS.GEOGRAPHY, {
      isAscending: false,
      granularity,
      startMillis,
      endMillis,
    });
  },

  async fetchPopularContent(startMillis, endMillis, granularity) {
    return this.apiFetch(SQSTATS.ENDPOINTS.POPULAR_CONTENT, {
      limit: SQSTATS.POPULAR_CONTENT_LIMIT,
      sortBy: 'views',
      isAscending: false,
      granularity,
      startMillis,
      endMillis,
    });
  },

  async fetchSalesOverview(startMillis, endMillis, granularity) {
    return this.apiFetch(SQSTATS.ENDPOINTS.SALES_OVERVIEW, {
      salesChannelSourceExtensionIds: 'SITE',
      granularity,
      startMillis,
      endMillis,
    });
  },
};
