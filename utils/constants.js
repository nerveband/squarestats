const SQSTATS = {
  API_BASE: '/api/census-frontend/1/',

  ENDPOINTS: {
    SETTINGS: 'settings',
    TRAFFIC_OVERVIEW: 'traffic-overview',
    TRAFFIC_SOURCES: 'traffic-sources/overview',
    GEOGRAPHY: 'geography/metrics/countries',
    POPULAR_CONTENT: 'popular-content/pages',
    SALES_OVERVIEW: 'sales-overview',
  },

  REPORTS: {
    TRAFFIC_OVERVIEW: {
      id: 'traffic_overview',
      label: 'Traffic Overview',
      endpoint: 'TRAFFIC_OVERVIEW',
      description: 'Visits, unique visitors, page views, bounce rate',
    },
    TRAFFIC_SOURCES: {
      id: 'traffic_sources',
      label: 'Traffic Sources',
      endpoint: 'TRAFFIC_SOURCES',
      description: 'Source breakdown with visits, revenue, orders',
    },
    GEOGRAPHY: {
      id: 'geography',
      label: 'Geography',
      endpoint: 'GEOGRAPHY',
      description: 'Visits by country',
    },
    POPULAR_CONTENT: {
      id: 'popular_content',
      label: 'Popular Content',
      endpoint: 'POPULAR_CONTENT',
      description: 'Page views, time on page, bounce/exit rates',
    },
    SALES_OVERVIEW: {
      id: 'sales_overview',
      label: 'Sales Overview',
      endpoint: 'SALES_OVERVIEW',
      description: 'Revenue, orders, average order value',
    },
  },

  GRANULARITY: {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY',
  },

  RATE_LIMIT_MS: 200,
  CHUNK_SIZE_DAYS: 30,
  TRAFFIC_SOURCES_LIMIT: 50,
  POPULAR_CONTENT_LIMIT: 100,
};
