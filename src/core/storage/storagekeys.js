/** @module StorageKeys */

/**
 * StorageKeys is an ENUM are considered the root context
 * for how data is stored and scoped in the storage.
 *
 * @enum {string}
 */
export default {
  NAVIGATION: 'navigation', // Has been cut over to the new global storage
  UNIVERSAL_RESULTS: 'universal-results', // Has been cut over to the new global storage
  VERTICAL_RESULTS: 'vertical-results', // Has been cut over to the new global storage
  ALTERNATIVE_VERTICALS: 'alternative-verticals', // Has been cut over to the new global storage
  AUTOCOMPLETE: 'autocomplete', // Has been cut over to the new global storage
  DIRECT_ANSWER: 'direct-answer', // Has been cut over to the new global storage
  FILTER: 'filter', // DEPRECATED // Has been cut over to the new global storage
  STATIC_FILTER_NODE: 'static-filter-node', // Has been cut over to the new global storage
  QUERY: 'query',
  QUERY_ID: 'query-id', // Has been cut over to the new global storage
  FACET_FILTER_NODE: 'facet-filter-node', // Has been cut over to the new global storage
  DYNAMIC_FILTERS: 'dynamic-filters',
  GEOLOCATION: 'geolocation', // Has been cut over to the new global storage
  INTENTS: 'intents',
  QUESTION_SUBMISSION: 'question-submission', // Has been cut over to the new global storage
  SEARCH_CONFIG: 'search-config',
  SEARCH_OFFSET: 'search-offset',
  SPELL_CHECK: 'spell-check',
  LOCATION_BIAS: 'location-bias', // Has been cut over to the new global storage
  SESSIONS_OPT_IN: 'sessions-opt-in',
  VERTICAL_PAGES_CONFIG: 'vertical-pages-config',
  LOCALE: 'locale', // Has been cut over to the new global storage
  SORT_BYS: 'sort-bys', // Has been cut over to the new global storage
  NO_RESULTS_CONFIG: 'no-results-config', // Has been cut over to the new global storage
  LOCATION_RADIUS: 'location-radius', // Has been cut over to the new global storage
  RESULTS_HEADER: 'results-header',
  API_CONTEXT: 'context',
  REFERRER_PAGE_URL: 'referrerPageUrl',
  QUERY_TRIGGER: 'queryTrigger',
  FACETS_LOADED: 'facets-loaded',
  QUERY_SOURCE: 'query-source' // Has been cut over to the new global storage
};
