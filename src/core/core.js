/** @module Core */

import SearchApi from './search/searchapi';
import AutoCompleteApi from './search/autocompleteapi';
import QuestionAnswerApi from './search/questionanswerapi';

import SearchDataTransformer from './search/searchdatatransformer';

import StorageKeys from './storage/storagekeys';
import VerticalResults from './models/verticalresults';
import UniversalResults from './models/universalresults';
import QuestionSubmission from './models/questionsubmission';

/**
 * Core is the main application container for all of the network and storage
 * related behaviors of the application.
 */
export default class Core {
  constructor (config = {}) {
    if (typeof config.apiKey !== 'string') {
      throw new Error('Missing required `apiKey`. Type must be {string}');
    }

    if (typeof config.answersKey !== 'string') {
      throw new Error('Missing required `answersKey`. Type must be {string}');
    }

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
    this._answersKey = config.answersKey;

    /**
     * The answers config version to use for all requests
     * @type {string}
     * @private
     */
    this._configVersion = config.configVersion;

    /**
     * A reference to the client locale used for all requests. If not specified, defaults to "en" (for
     * backwards compatibility).
     * @type {string}
     * @private
     */
    this._locale = config.locale || 'en';

    /**
     * A map of field formatters used to format results, if present
     * @type {Object.<string, function>}
     * @private
     */
    this._fieldFormatters = config.fieldFormatters || {};

    /**
     * A reference to the core data storage that powers the UI
     * @type {GlobalStorage}
     * @private
     */
    this.globalStorage = config.globalStorage;

    /**
     * A reference to the core persistent storage
     * @type {PersistentStorage}
     * @private
     */
    this.persistentStorage = config.persistentStorage;

    /**
     * An abstraction containing the integration with the RESTful search API
     * For both vertical and universal search
     * @type {Search}
     * @private
     */
    this._searcher = new SearchApi({
      apiKey: this._apiKey,
      answersKey: this._answersKey,
      configVersion: this._configVersion,
      locale: this._locale
    });

    /**
     * An abstraction containing the integration with the RESTful autocomplete API
     * For filter search, vertical autocomplete, and universal autocomplete
     * @type {Autocomplete}
     * @private
     */
    this._autoComplete = new AutoCompleteApi({
      apiKey: this._apiKey,
      answersKey: this._answersKey,
      configVersion: this._configVersion,
      locale: this._locale
    });

    /**
     * An abstraction for interacting with the Q&A rest interface
     * @type {QuestionAnswerApi}
     * @private
     */
    this._questionAnswer = new QuestionAnswerApi({
      apiKey: this._apiKey
    });
  }

  /**
   * Search in the context of a vertical
   * @param {string} verticalKey vertical ID for the search
   * @param {object} query The query details
   * @param {string} query.input The input to search for
   * @param {string} query.filter The filter to use in the search
   * @param {string} query.facetFilter The facet filter to use in the search
   * @param {number} query.limit The max number of results to include, max of 50
   * @param {number} query.offset The results offset, for fetching more results of the same query
   * @param {string} query.id The query ID to use. If paging within a query, the same ID should be used
   * @param {boolean} query.append If true, adds the results of this query to the end of the current results, defaults false
   */
  verticalSearch (verticalKey, query) {
    if (!query.append) {
      this.globalStorage.set(StorageKeys.VERTICAL_RESULTS, VerticalResults.searchLoading());
    }

    return this._searcher
      .verticalSearch(verticalKey, {
        limit: this.globalStorage.getState(StorageKeys.SEARCH_LIMIT),
        ...query,
        isDynamicFiltersEnabled: this._isDynamicFiltersEnabled
      })
      .then(response => SearchDataTransformer.transformVertical(response, this._fieldFormatters))
      .then(data => {
        this.globalStorage.set(StorageKeys.QUERY_ID, data[StorageKeys.QUERY_ID]);
        this.globalStorage.set(StorageKeys.NAVIGATION, data[StorageKeys.NAVIGATION]);

        if (query.append) {
          const mergedResults = this.globalStorage.getState(StorageKeys.VERTICAL_RESULTS)
            .append(data[StorageKeys.VERTICAL_RESULTS]);
          this.globalStorage.set(StorageKeys.VERTICAL_RESULTS, mergedResults);
        } else {
          this.globalStorage.set(StorageKeys.VERTICAL_RESULTS, data[StorageKeys.VERTICAL_RESULTS]);
        }

        if (data[StorageKeys.DYNAMIC_FILTERS]) {
          this.globalStorage.set(StorageKeys.DYNAMIC_FILTERS, data[StorageKeys.DYNAMIC_FILTERS]);
        }
        if (data[StorageKeys.SPELL_CHECK]) {
          this.globalStorage.set(StorageKeys.SPELL_CHECK, data[StorageKeys.SPELL_CHECK]);
        }
      });
  }

  search (queryString, urls) {
    this.globalStorage.set(StorageKeys.UNIVERSAL_RESULTS, UniversalResults.searchLoading());

    return this._searcher
      .universalSearch(queryString)
      .then(response => SearchDataTransformer.transform(response, urls, this._fieldFormatters))
      .then(data => {
        this.globalStorage.set(StorageKeys.QUERY_ID, data[StorageKeys.QUERY_ID]);
        this.globalStorage.set(StorageKeys.NAVIGATION, data[StorageKeys.NAVIGATION]);
        this.globalStorage.set(StorageKeys.DIRECT_ANSWER, data[StorageKeys.DIRECT_ANSWER]);
        this.globalStorage.set(StorageKeys.UNIVERSAL_RESULTS, data[StorageKeys.UNIVERSAL_RESULTS], urls);
        this.globalStorage.set(StorageKeys.QUESTION_SUBMISSION, new QuestionSubmission({
          questionText: queryString
        }));
        this.globalStorage.set(StorageKeys.SPELL_CHECK, data[StorageKeys.SPELL_CHECK]);
      });
  }

  /**
   * Given an input, query for a list of similar results and set into storage
   *
   * @param {string} input     the string to autocomplete
   * @param {string} namespace the namespace to use for the storage key
   */
  autoCompleteUniversal (input, namespace) {
    return this._autoComplete
      .queryUniversal(input)
      .then(data => {
        this.globalStorage.set(`${StorageKeys.AUTOCOMPLETE}.${namespace}`, data);
      });
  }

  /**
   * Given an input, query for a list of similar results in the provided vertical
   * and set into storage
   *
   * @param {string} input       the string to autocomplete
   * @param {string} namespace the namespace to use for the storage key
   * @param {string} verticalKey the vertical key for the experience
   * @param {string} barKey      the bar key for the experience
   */
  autoCompleteVertical (input, namespace, verticalKey, barKey) {
    return this._autoComplete
      .queryVertical(input, verticalKey, barKey)
      .then(data => {
        this.globalStorage.set(`${StorageKeys.AUTOCOMPLETE}.${namespace}`, data);
      });
  }

  /**
   * Given an input, provide a list of suitable filters for autocompletion
   *
   * @param {string} input         the string to search for filters with
   * @param {string} namespace     the namespace to use for the storage key
   * @param {string} verticalKey   the vertical key for the experience
   * @param {string} barKey        the bar key for the experience
   */
  autoCompleteFilter (input, namespace, verticalKey, barKey) {
    return this._autoComplete
      .queryFilter(input, verticalKey, barKey)
      .then(data => {
        this.globalStorage.set(`${StorageKeys.AUTOCOMPLETE}.${namespace}`, data);
      });
  }

  /**
   * Submits a question to the server and updates the underlying question model
   * @param {object} question The question object to submit to the server
   * @param {number} question.entityId The entity to associate with the question (required)
   * @param {string} question.lanuage The language of the question
   * @param {string} question.site The "publisher" of the (e.g. 'FIRST_PARTY')
   * @param {string} question.name The name of the author
   * @param {string} question.email The email address of the author
   * @param {string} question.questionText The question
   * @param {string} question.questionDescription Additional information about the question
   */
  submitQuestion (question) {
    return this._questionAnswer
      .submitQuestion(question)
      .then(data => {
        this.globalStorage.set(
          StorageKeys.QUESTION_SUBMISSION,
          QuestionSubmission.submitted());
      });
  }

  /**
   * Stores the given query into storage, to be used for the next search
   * @param {string} query the query to store
   */
  setQuery (query) {
    this.globalStorage.set(StorageKeys.QUERY, query);
  }

  /**
   * Stores the provided query ID, to be used in analytics
   * @param {string} queryId The query id to store
   */
  setQueryId (queryId) {
    this.globalStorage.set(StorageKeys.QUERY_ID, queryId);
  }

  /**
   * Stores the given filter into storage, to be used for the next search
   *
   * @param {string} namespace the namespace to use for the storage key
   * @param {Filter} filter    the filter to set
   */
  setFilter (namespace, filter) {
    this.globalStorage.set(`${StorageKeys.FILTER}.${namespace}`, filter);
  }

  setFacetFilter (namespace, filter) {
    this.globalStorage.set(`${StorageKeys.FACET_FILTER}.${namespace}`, filter);
  }

  enableDynamicFilters () {
    this._isDynamicFiltersEnabled = true;
  }

  setSearchLimit (limit) {
    this.globalStorage.set(StorageKeys.SEARCH_LIMIT, limit);
  }

  on (evt, moduleId, cb) {
    return this.globalStorage.on(evt, moduleId, cb);
  }
}
