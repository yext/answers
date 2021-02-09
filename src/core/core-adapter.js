/** @module Core */
import { provideCore } from '@yext/answers-core';

import SearchDataTransformer from './search/searchdatatransformer';

import VerticalResults from './models/verticalresults';
import UniversalResults from './models/universalresults';
import QuestionSubmission from './models/questionsubmission';
import Navigation from './models/navigation';
import AlternativeVerticals from './models/alternativeverticals';
import LocationBias from './models/locationbias';
import QueryTriggers from './models/querytriggers';

import StorageKeys from './storage/storagekeys';
import AnalyticsEvent from './analytics/analyticsevent';
import FilterRegistry from './filters/filterregistry';
import { AnswersEndpointError } from './errors/errors';
import DirectAnswer from './models/directanswer';
import AutoCompleteResponseTransformer from './search/autocompleteresponsetransformer';

/** @typedef {import('./services/searchservice').default} SearchService */
/** @typedef {import('./services/autocompleteservice').default} AutoCompleteService */
/** @typedef {import('./services/questionanswerservice').default} QuestionAnswerService */
/** @typedef {import('./storage/storage').default} Storage */

/**
 * CoreAdapter is the main application container for all of the network and storage
 * related behaviors of the application. It uses an instance of the external Core
 * library to perform the actual network calls.
 */
export default class CoreAdapter {
  constructor (config = {}) {
    /**
     * A reference to the client API Key used for all requests
     * @type {string}
     * @private
     */
    this._apiKey = config.apiKey;

    /**
     * A reference to the client Answers Key used for all requests
     * @type {string}
     * @private
     */
    this._experienceKey = config.experienceKey;

    /**
     * The answers config version to use for all requests
     * @type {string}
     * @private
     */
    this._experienceVersion = config.experienceVersion;

    /**
     * A reference to the client locale used for all requests. If not specified, defaults to "en" (for
     * backwards compatibility).
     * @type {string}
     * @private
     */
    this._locale = config.locale;

    /**
     * A map of field formatters used to format results, if present
     * @type {Object<string, function>}
     * @private
     */
    this._fieldFormatters = config.fieldFormatters || {};

    /**
     * A reference to the core data storage that powers the UI
     * @type {Storage}
     */
    this.storage = config.storage;

    /**
     * The filterRegistry is in charge of setting, removing, and retrieving filters
     * and facet filters from storage.
     * @type {FilterRegistry}
     */
    this.filterRegistry = new FilterRegistry(this.storage);

    /**
     * An abstraction containing the integration with the RESTful search API
     * For both vertical and universal search
     * @type {SearchService}
     * @private
     */
    this._searcher = config.searchService;

    /**
     * An abstraction containing the integration with the RESTful autocomplete API
     * For filter search, vertical autocomplete, and universal autocomplete
     * @type {AutoCompleteService}
     * @private
     */
    this._autoComplete = config.autoCompleteService;

    /**
     * A local reference to the analytics reporter, used to report events for this component
     * @type {AnalyticsReporter}
     */
    this._analyticsReporter = config.analyticsReporter;

    /**
     * A user-given function that returns an analytics event to fire after a universal search.
     * @type {Function}
     */
    this.onUniversalSearch = config.onUniversalSearch || function () {};

    /**
     * A user-given function that returns an analytics event to fire after a vertical search.
     * @type {Function}
     */
    this.onVerticalSearch = config.onVerticalSearch || function () {};
  }

  /**
   * Initializes the {@link CoreAdapter} by providing it with an instance of the Core library.
   */
  init () {
    const params = {
      apiKey: this._apiKey,
      experienceKey: this._experienceKey,
      locale: this._locale
    };

    this._coreLibrary = provideCore(params);
  }

  /**
   * @returns {boolean} A boolean indicating if the {@link CoreAdapter} has been
   *                    initailized.
   */
  isInitialized () {
    return !!this._coreLibrary;
  }

  /**
   * Search in the context of a vertical
   * @param {string} verticalKey vertical ID for the search
   * @param {Object} options additional settings for the search.
   * @param {Object} query The query details
   * @param {string} query.input The input to search for
   * @param {string} query.id The query ID to use. If paging within a query, the same ID should be used
   * @param {boolean} query.append If true, adds the results of this query to the end of the current results, defaults false
   */
  verticalSearch (verticalKey, options = {}, query = {}) {
    window.performance.mark('yext.answers.verticalQueryStart');
    if (!query.append) {
      this.storage.set(StorageKeys.VERTICAL_RESULTS, VerticalResults.searchLoading());
      this.storage.set(StorageKeys.SPELL_CHECK, {});
      this.storage.set(StorageKeys.LOCATION_BIAS, {});
    }

    const { resetPagination, useFacets } = options;
    if (resetPagination) {
      this.storage.delete(StorageKeys.SEARCH_OFFSET);
    }

    if (!useFacets) {
      this.filterRegistry.setFacetFilterNodes([], []);
    }

    const { setQueryParams } = options;
    const context = this.storage.get(StorageKeys.API_CONTEXT);
    const referrerPageUrl = this.storage.get(StorageKeys.REFERRER_PAGE_URL);

    const defaultQueryInput = this.storage.get(StorageKeys.QUERY) || '';
    const parsedQuery = Object.assign({}, { input: defaultQueryInput }, query);

    if (setQueryParams) {
      if (context) {
        this.storage.setWithPersist(StorageKeys.API_CONTEXT, context);
      }
      if (referrerPageUrl !== undefined) {
        this.storage.setWithPersist(StorageKeys.REFERRER_PAGE_URL, referrerPageUrl);
      }
    }

    const searchConfig = this.storage.get(StorageKeys.SEARCH_CONFIG) || {};
    if (!searchConfig.verticalKey) {
      this.storage.set(StorageKeys.SEARCH_CONFIG, {
        ...searchConfig,
        verticalKey: verticalKey
      });
    }

    const locationRadiusFilterNode = this.getLocationRadiusFilterNode();
    const shouldPushState =
      this.shouldPushState(this.storage.get(StorageKeys.QUERY_TRIGGER));
    const queryTrigger = this.getQueryTriggerForSearchApi(
      this.storage.get(StorageKeys.QUERY_TRIGGER)
    );

    return this._coreLibrary
      .verticalSearch({
        verticalKey: verticalKey || searchConfig.verticalKey,
        limit: this.storage.get(StorageKeys.SEARCH_CONFIG).limit,
        coordinates: this.storage.get(StorageKeys.GEOLOCATION),
        query: parsedQuery.input,
        retrieveFacets: this._isDynamicFiltersEnabled,
        facetFilters: this.filterRegistry.getFacetFilterPayload(),
        staticFilters: this.filterRegistry.getStaticFilterPayload(),
        offset: this.storage.get(StorageKeys.SEARCH_OFFSET) || 0,
        skipSpellCheck: this.storage.get(StorageKeys.SKIP_SPELL_CHECK),
        queryTrigger: queryTrigger,
        sessionTrackingEnabled: this.storage.get(StorageKeys.SESSIONS_OPT_IN).value,
        sortBys: this.storage.get(StorageKeys.SORT_BYS),
        locationRadius: locationRadiusFilterNode ? locationRadiusFilterNode.getFilter().value : null,
        context: context,
        referrerPageUrl: referrerPageUrl,
        querySource: this.storage.get(StorageKeys.QUERY_SOURCE)
      })
      .then(response => SearchDataTransformer.transformVertical(response, this._fieldFormatters, verticalKey))
      .then(data => {
        this.storage.set(StorageKeys.QUERY_ID, data[StorageKeys.QUERY_ID]);
        this.storage.set(StorageKeys.NAVIGATION, data[StorageKeys.NAVIGATION]);
        this.storage.set(StorageKeys.ALTERNATIVE_VERTICALS, data[StorageKeys.ALTERNATIVE_VERTICALS]);

        if (query.append) {
          const mergedResults = this.storage.get(StorageKeys.VERTICAL_RESULTS)
            .append(data[StorageKeys.VERTICAL_RESULTS]);
          this.storage.set(StorageKeys.VERTICAL_RESULTS, mergedResults);
        } else {
          this.storage.set(StorageKeys.VERTICAL_RESULTS, data[StorageKeys.VERTICAL_RESULTS]);
        }

        if (data[StorageKeys.DYNAMIC_FILTERS]) {
          this.storage.set(StorageKeys.DYNAMIC_FILTERS, data[StorageKeys.DYNAMIC_FILTERS]);
          this.storage.set(StorageKeys.RESULTS_HEADER, data[StorageKeys.DYNAMIC_FILTERS]);
        }
        if (data[StorageKeys.SPELL_CHECK]) {
          this.storage.set(StorageKeys.SPELL_CHECK, data[StorageKeys.SPELL_CHECK]);
        }
        if (data[StorageKeys.LOCATION_BIAS]) {
          this.storage.set(StorageKeys.LOCATION_BIAS, data[StorageKeys.LOCATION_BIAS]);
        }
        this.storage.delete(StorageKeys.SKIP_SPELL_CHECK);
        this.storage.delete(StorageKeys.QUERY_TRIGGER);

        const exposedParams = {
          verticalKey: verticalKey,
          queryString: parsedQuery.input,
          resultsCount: this.storage.get(StorageKeys.VERTICAL_RESULTS).resultsCount,
          resultsContext: data[StorageKeys.VERTICAL_RESULTS].resultsContext
        };
        const analyticsEvent = this.onVerticalSearch(exposedParams);
        if (typeof analyticsEvent === 'object') {
          this._analyticsReporter.report(AnalyticsEvent.fromData(analyticsEvent));
        }
        if (shouldPushState) {
          this.storage.pushStateToHistory();
        }
        window.performance.mark('yext.answers.verticalQueryResponseRendered');
      });
  }

  clearResults () {
    this.storage.set(StorageKeys.QUERY, null);
    this.storage.set(StorageKeys.QUERY_ID, '');
    this.storage.set(StorageKeys.RESULTS_HEADER, {});
    this.storage.set(StorageKeys.SPELL_CHECK, {}); // TODO has a model but not cleared w new
    this.storage.set(StorageKeys.DYNAMIC_FILTERS, {}); // TODO has a model but not cleared w new
    this.storage.set(StorageKeys.QUESTION_SUBMISSION, new QuestionSubmission({}));
    this.storage.set(StorageKeys.NAVIGATION, new Navigation());
    this.storage.set(StorageKeys.ALTERNATIVE_VERTICALS, new AlternativeVerticals({}));
    this.storage.set(StorageKeys.DIRECT_ANSWER, new DirectAnswer({}));
    this.storage.set(StorageKeys.LOCATION_BIAS, new LocationBias({}));
    this.storage.set(StorageKeys.VERTICAL_RESULTS, new VerticalResults({}));
    this.storage.set(StorageKeys.UNIVERSAL_RESULTS, new UniversalResults({}));
  }

  /**
   * Page within the results of the last query
   * TODO: Should id be in all searches? Currently is only in searches done by the pagination
   * component
   * @param {string} verticalKey The vertical key to use in the search
   */
  verticalPage (verticalKey) {
    this.verticalSearch(verticalKey, { useFacets: true, setQueryParams: true }, {
      id: this.storage.get(StorageKeys.QUERY_ID)
    });
  }

  search (queryString, urls, options = {}) {
    window.performance.mark('yext.answers.universalQueryStart');
    const { setQueryParams } = options;
    const context = this.storage.get(StorageKeys.API_CONTEXT);
    const referrerPageUrl = this.storage.get(StorageKeys.REFERRER_PAGE_URL);

    if (setQueryParams) {
      if (context) {
        this.storage.setWithPersist(StorageKeys.API_CONTEXT, context);
      }
      if (referrerPageUrl !== undefined) {
        this.storage.setWithPersist(StorageKeys.REFERRER_PAGE_URL, referrerPageUrl);
      }
    }

    this.storage.set(StorageKeys.DIRECT_ANSWER, {});
    this.storage.set(StorageKeys.UNIVERSAL_RESULTS, UniversalResults.searchLoading());
    this.storage.set(StorageKeys.QUESTION_SUBMISSION, {});
    this.storage.set(StorageKeys.SPELL_CHECK, {});
    this.storage.set(StorageKeys.LOCATION_BIAS, {});

    const shouldPushState =
      this.shouldPushState(this.storage.get(StorageKeys.QUERY_TRIGGER));
    const queryTrigger = this.getQueryTriggerForSearchApi(
      this.storage.get(StorageKeys.QUERY_TRIGGER)
    );
    return this._coreLibrary
      .universalSearch({
        query: queryString,
        coordinates: this.storage.get(StorageKeys.GEOLOCATION),
        skipSpellCheck: this.storage.get(StorageKeys.SKIP_SPELL_CHECK),
        queryTrigger: queryTrigger,
        sessionTrackingEnabled: this.storage.get(StorageKeys.SESSIONS_OPT_IN).value,
        context: context,
        referrerPageUrl: referrerPageUrl,
        querySource: this.storage.get(StorageKeys.QUERY_SOURCE)
      })
      .then(response => SearchDataTransformer.transformUniversal(response, urls, this._fieldFormatters))
      .then(data => {
        this.storage.set(StorageKeys.QUERY_ID, data[StorageKeys.QUERY_ID]);
        this.storage.set(StorageKeys.NAVIGATION, data[StorageKeys.NAVIGATION]);
        this.storage.set(StorageKeys.DIRECT_ANSWER, data[StorageKeys.DIRECT_ANSWER]);
        this.storage.set(StorageKeys.UNIVERSAL_RESULTS, data[StorageKeys.UNIVERSAL_RESULTS], urls);
        this.storage.set(StorageKeys.SPELL_CHECK, data[StorageKeys.SPELL_CHECK]);
        this.storage.set(StorageKeys.LOCATION_BIAS, data[StorageKeys.LOCATION_BIAS]);

        this.storage.delete(StorageKeys.SKIP_SPELL_CHECK);
        this.storage.delete(StorageKeys.QUERY_TRIGGER);

        const exposedParams = this._getOnUniversalSearchParams(
          data[StorageKeys.UNIVERSAL_RESULTS].sections,
          queryString);
        const analyticsEvent = this.onUniversalSearch(exposedParams);
        if (typeof analyticsEvent === 'object') {
          this._analyticsReporter.report(AnalyticsEvent.fromData(analyticsEvent));
        }
        if (shouldPushState) {
          this.storage.pushStateToHistory();
        }
        window.performance.mark('yext.answers.universalQueryResponseRendered');
      });
  }

  /**
   * Builds the object passed as a parameter to onUniversalSearch. This object
   * contains information about the universal search's query and result counts.
   *
   * @param {Array<Section>} sections The sections of results.
   * @param {string} queryString The search query.
   * @return {Object<string, ?>}
   */
  _getOnUniversalSearchParams (sections, queryString) {
    const resultsCountByVertical = sections.reduce(
      (resultsCountMap, section) => {
        const { verticalConfigId, resultsCount, results } = section;
        resultsCountMap[verticalConfigId] = {
          totalResultsCount: resultsCount,
          displayedResultsCount: results.length
        };
        return resultsCountMap;
      },
      {});
    const exposedParams = {
      queryString,
      sectionsCount: sections.length,
      resultsCountByVertical
    };

    return exposedParams;
  }

  /**
   * Given an input, query for a list of similar results and set into storage
   *
   * @param {string} input     the string to autocomplete
   * @param {string} namespace the namespace to use for the storage key
   */
  autoCompleteUniversal (input, namespace) {
    return this._coreLibrary
      .universalAutoComplete({
        input: input,
        sessionTrackingEnabled: this.storage.get(StorageKeys.SESSIONS_OPT_IN).value
      })
      .then(response => AutoCompleteResponseTransformer.transformAutoCompleteResponse(response))
      .then(data => {
        this.storage.set(`${StorageKeys.AUTOCOMPLETE}.${namespace}`, data);
        return data;
      });
  }

  /**
   * Given an input, query for a list of similar results in the provided vertical
   * and set into storage
   *
   * @param {string} input       the string to autocomplete
   * @param {string} namespace the namespace to use for the storage key
   * @param {string} verticalKey the vertical key for the experience
   */
  autoCompleteVertical (input, namespace, verticalKey) {
    return this._coreLibrary
      .verticalAutoComplete({
        input: input,
        verticalKey: verticalKey,
        sessionTrackingEnabled: this.storage.get(StorageKeys.SESSIONS_OPT_IN).value
      })
      .then(response => AutoCompleteResponseTransformer.transformAutoCompleteResponse(response))
      .then(data => {
        this.storage.set(`${StorageKeys.AUTOCOMPLETE}.${namespace}`, data);
        return data;
      });
  }

  /**
   * Given an input, provide a list of suitable filters for autocompletion
   *
   * @param {string} input  the string to search for filters with
   * @param {object} config  the config to serach for filters with
   * @param {string} config.namespace  the namespace to use for the storage key
   * @param {string} config.verticalKey the vertical key for the config
   * @param {object} config.searchParameters  the search parameters for the config v2
   */
  autoCompleteFilter (input, config) {
    const searchParamFields = config.searchParameters.fields.map(field => ({
      fieldApiName: field.fieldId,
      entityType: field.entityTypeId,
      fetchEntities: field.shouldFetchEntities
    }));
    const searchParams = {
      sectioned: config.searchParameters.sectioned,
      fields: searchParamFields
    };
    return this._coreLibrary
      .filterAutoComplete({
        input: input,
        verticalKey: config.verticalKey,
        searchParameters: searchParams,
        sessionTrackingEnabled: this.storage.get(StorageKeys.SESSIONS_OPT_IN).value
      })
      .then(response => AutoCompleteResponseTransformer.transformFilterAutoCompleteResponse(response))
      .then(data => {
        this.storage.set(`${StorageKeys.AUTOCOMPLETE}.${config.namespace}`, data);
      });
  }

  /**
   * Submits a question to the server and updates the underlying question model
   * @param {object} question The question object to submit to the server
   * @param {number} question.entityId The entity to associate with the question (required)
   * @param {string} question.site The "publisher" of the (e.g. 'FIRST_PARTY')
   * @param {string} question.name The name of the author
   * @param {string} question.email The email address of the author
   * @param {string} question.questionText The question
   * @param {string} question.questionDescription Additional information about the question
   */
  submitQuestion (question) {
    return this._coreLibrary
      .submitQuestion({
        ...question,
        sessionTrackingEnabled: this.storage.get(StorageKeys.SESSIONS_OPT_IN).value
      })
      .catch(error => {
        throw new AnswersEndpointError(
          'Question submit failed',
          'QuestionAnswerApi',
          error);
      })
      .then(() => {
        this.storage.set(
          StorageKeys.QUESTION_SUBMISSION,
          QuestionSubmission.submitted());
      });
  }

  /**
   * Stores the given sortBy into storage, to be used for the next search
   * @param {Object} sortByOptions
   */
  setSortBys (...sortByOptions) {
    const sortBys = sortByOptions.map(option => {
      return {
        type: option.type,
        field: option.field,
        direction: option.direction
      };
    });
    this.storage.set(StorageKeys.SORT_BYS, JSON.stringify(sortBys));
  }

  /**
   * Clears the sortBys key in storage.
   */
  clearSortBys () {
    this.storage.delete(StorageKeys.SORT_BYS);
  }

  /**
   * Stores the given query into storage, to be used for the next search
   * @param {string} query the query to store
   */
  setQuery (query) {
    this.storage.set(StorageKeys.QUERY, query);
  }

  /**
   * Stores the provided query ID, to be used in analytics
   * @param {string} queryId The query id to store
   */
  setQueryId (queryId) {
    this.storage.set(StorageKeys.QUERY_ID, queryId);
  }

  /**
   * Get all of the {@link FilterNode}s for static filters.
   * @returns {Array<FilterNode>}
   */
  getStaticFilterNodes () {
    return this.filterRegistry.getStaticFilterNodes();
  }

  /**
   * Get all of the active {@link FilterNode}s for facets.
   * @returns {Array<FilterNode>}
   */
  getFacetFilterNodes () {
    return this.filterRegistry.getFacetFilterNodes();
  }

  /**
   * Get the {@link FilterNode} affecting the locationRadius url parameter.
   * @returns {FilterNode}
   */
  getLocationRadiusFilterNode () {
    return this.filterRegistry.getFilterNodeByKey(StorageKeys.LOCATION_RADIUS);
  }

  /**
   * Sets the filter nodes used for the current facet filters.
   *
   * Because the search response only sends back one
   * set of facet filters, there can only be one active facet filter node
   * at a time.
   * @param {Array<string>} availableFieldIds
   * @param {Array<FilterNode>} filterNodes
   */
  setFacetFilterNodes (availableFieldids = [], filterNodes = []) {
    this.filterRegistry.setFacetFilterNodes(availableFieldids, filterNodes);
  }

  /**
   * Sets the specified {@link FilterNode} under the given key.
   * Will replace a preexisting node if there is one.
   * @param {string} namespace
   * @param {FilterNode} filterNode
   */
  setStaticFilterNodes (namespace, filterNode) {
    this.filterRegistry.setStaticFilterNodes(namespace, filterNode);
  }

  /**
   * Sets the locationRadius filterNode.
   * @param {FilterNode} filterNode
   */
  setLocationRadiusFilterNode (filterNode) {
    this.filterRegistry.setLocationRadiusFilterNode(filterNode);
  }

  /**
   * Remove the static FilterNode with this namespace.
   * @param {string} namespace
   */
  clearStaticFilterNode (namespace) {
    this.filterRegistry.clearStaticFilterNode(namespace);
  }

  /**
   * Remove all facet FilterNodes.
   */
  clearFacetFilterNodes () {
    this.filterRegistry.clearFacetFilterNodes();
  }

  /**
   * Clears the locationRadius filterNode.
   */
  clearLocationRadiusFilterNode () {
    this.filterRegistry.clearLocationRadiusFilterNode();
  }

  /**
   * Returns the query trigger for the search API given the SDK query trigger
   * @param {QueryTriggers} queryTrigger SDK query trigger
   * @returns {QueryTriggers} query trigger if accepted by the search API, null o/w
   */
  getQueryTriggerForSearchApi (queryTrigger) {
    if (queryTrigger === QueryTriggers.QUERY_PARAMETER) {
      return null;
    }
    return queryTrigger;
  }

  /**
   * Determines whether or not a new url state should be pushed for a search.
   *
   * If queryTrigger is INITIALIZE, don't push an extra state on page load.
   * If queryTrigger is QUERY_PARAMETER, this only occurs either on page load
   * or when hitting the history back and forward buttons. For both cases we
   * don't push an extra state.
   * If queryTrigger is SUGGEST, this only occurs when clicking a spellcheck
   * link, which reloads the page, so don't push an extra state.
   *
   * @param {QueryTriggers} queryTrigger SDK query trigger
   * @returns {boolean}
   */
  shouldPushState (queryTrigger) {
    return queryTrigger !== QueryTriggers.INITIALIZE &&
      queryTrigger !== QueryTriggers.QUERY_PARAMETER &&
      queryTrigger !== QueryTriggers.SUGGEST;
  }

  enableDynamicFilters () {
    this._isDynamicFiltersEnabled = true;
  }

  on (evt, storageKey, cb) {
    this.storage.registerListener({
      eventType: evt,
      storageKey: storageKey,
      callback: cb
    });
    return this.storage;
  }
}
