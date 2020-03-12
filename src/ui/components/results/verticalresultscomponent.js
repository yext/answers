/** @module VerticalResultsComponent */

import Component from '../component';

import AlternativeVerticalsComponent from './alternativeverticalscomponent';
import MapComponent from '../map/mapcomponent';
import ResultsContext from '../../../core/storage/resultscontext';
import StorageKeys from '../../../core/storage/storagekeys';
import SearchStates from '../../../core/storage/searchstates';
import CardComponent from '../cards/cardcomponent';
import ResultsHeaderComponent from './resultsheadercomponent';

class VerticalResultsConfig {
  constructor (config = {}) {
    Object.assign(this, config);

    /**
     * isUniversal is set to true if this component is added by the UniversalResultsComponent
     * @type {boolean}
     * @private
     */
    this.isUniversal = config.isUniversal || false;

    /**
     * _displayAllResults is set to true if the config option noResults.displayAllResults is true,
     * meaning that all results for the vertical will display when there are no results for a query
     * @type {boolean}
     * @private
     */
    this._displayAllResults = config.noResults && config.noResults.displayAllResults;

    /**
     * Custom no results template
     * @type {string}
     */
    this.noResultsTemplate = config.noResults ? config.noResults.template : '';

    const parentOpts = config._parentOpts || {};

    /**
     * Custom render function
     * @type {function}
     */
    this.renderItem = config.renderItem || parentOpts.renderItem;

    /**
     * Custom item template
     * @type {string}
     */
    this.itemTemplate = config.itemTemplate || parentOpts.itemTemplate;

    /**
     * The url to the universal page for the no results page to link back to with current query
     * @type {string|null}
     */
    this._universalUrl = config.universalUrl;

    /**
     * The maximum number of columns to display, supports 1, 2, 3, or 4.
     * @type {number}
     */
    this.maxNumberOfColumns = config.maxNumberOfColumns || 1;

    /**
     * The config to pass to the card
     * @type {Object}
     */
    this.card = config.card || {};

    /**
     * Config options used in the {@link ResultsHeaderComponent}
     */
    this.resultsHeaderOpts = {
      /**
       * Whether to display the number of results.
       * @type {boolean}
       */
      showResultCount: config.showResultCount === undefined ? true : config.showResultCount,

      /**
       * If present, show the filters that were ultimately applied to this query
       * @type {boolean}
       */
      showAppliedFilters: config.showAppliedFilters === undefined ? true : config.showAppliedFilters,

      /**
       * If showResultCount and showAppliedFilters are true,
       * display this separator between the result count and the applied query filters
       * @type {string}
       */
      resultsCountSeparator: config.resultsCountSeparator || '|',

      /**
       * If showAppliedFilters is true, show the field name in the string followed by a colon.
       * @type {boolean}
       */
      showFieldNames: config.showFieldNames || false
    };
  }
}

export default class VerticalResultsComponent extends Component {
  constructor (config = {}, systemConfig = {}) {
    super(new VerticalResultsConfig(config), systemConfig);
    this.moduleId = StorageKeys.VERTICAL_RESULTS;
    this._verticalsConfig = this.core.globalStorage
      .getState(StorageKeys.VERTICAL_PAGES_CONFIG).get() || [];
    /**
     * @type {Array<Result>}
     */
    this.results = [];
    this.numColumns = this._config.maxNumberOfColumns;
    this.core.globalStorage.set(StorageKeys.NO_RESULTS_CONFIG, this._config.noResults || {});
  }

  mount () {
    if (Object.keys(this.getState()).length > 0) {
      super.mount();
    }
    return this;
  }

  static get duplicatesAllowed () {
    return true;
  }

  getUniversalUrl () {
    const universalConfig = this._verticalsConfig.find(config => !config.verticalKey) || {};
    let universalUrl = this._universalUrl;
    if (universalConfig.url) {
      universalUrl = universalConfig.url;
    }
    return `${universalUrl}?query=${this.query || ''}`;
  }

  setState (data, val) {
    /**
     * @type {Array<Result>}
     */
    this.results = data.results || [];
    this.resultsCount = data.resultsCount;
    this.verticalKey = data.verticalConfigId;
    this.appliedQueryFilters = data.appliedQueryFilters;
    const searchState = data.searchState || SearchStates.PRE_SEARCH;
    const displayResultsIfExist = this._config.isUniversal ||
      this._config._displayAllResults ||
      data.resultsContext === ResultsContext.NORMAL;
    const showResultsHeader = this._config.resultsHeaderOpts.showResultCount ||
      this._config.resultsHeaderOpts.showAppliedFilters;
    this.query = this.core.globalStorage.getState(StorageKeys.QUERY);

    return super.setState(Object.assign({ results: [] }, data, {
      isPreSearch: searchState === SearchStates.PRE_SEARCH,
      isSearchLoading: searchState === SearchStates.SEARCH_LOADING,
      isSearchComplete: searchState === SearchStates.SEARCH_COMPLETE,
      eventOptions: this.eventOptions(),
      universalUrl: this.getUniversalUrl(),
      query: this.query,
      currentVerticalLabel: this._currentVerticalLabel,
      resultsPresent: displayResultsIfExist && this.results.length !== 0,
      showNoResults: data.resultsContext === ResultsContext.NO_RESULTS,
      placeholders: new Array(this._config.maxNumberOfColumns - 1),
      numColumns: Math.min(this._config.maxNumberOfColumns, this.results.length),
      showResultsHeader: showResultsHeader
    }), val);
  }

  /**
   * helper to construct the eventOptions object for the view all link
   * @returns {string}
   */
  eventOptions () {
    return JSON.stringify({
      verticalConfigId: this.verticalKey
    });
  }

  static get type () {
    return 'VerticalResults';
  }

  /**
   * The template to render
   * @returns {string}
   * @override
   */
  static defaultTemplateName (config) {
    return 'results/verticalresults';
  }

  addChild (data, type, opts) {
    if (type === MapComponent.type) {
      const newOpts = Object.assign({}, this._config.mapConfig, opts);
      return super.addChild({ map: data }, type, newOpts);
    } else if (type === CardComponent.type) {
      const updatedData = {
        result: this.results[opts._index],
        verticalKey: this.verticalKey
      };
      const newOpts = {
        ...this._config.card,
        isUniversal: this._config.isUniversal,
        template: this._config.itemTemplate,
        render: this._config.renderItem,
        ...opts
      };
      return super.addChild(updatedData, type, newOpts);
    } else if (type === AlternativeVerticalsComponent.type) {
      const hasResults = this.results && this.results.length > 0;
      data = this.core.globalStorage.getState(StorageKeys.ALTERNATIVE_VERTICALS);
      const newOpts = {
        template: this._config.noResultsTemplate,
        universalUrl: this.getUniversalUrl(),
        verticalsConfig: this._verticalsConfig,
        isShowingResults: this._config._displayAllResults && hasResults,
        ...opts
      };
      return super.addChild(data, type, newOpts);
    } else if (type === ResultsHeaderComponent.type) {
      const resultsHeaderData = {
        resultsLength: this.results.length,
        resultsCount: this.resultsCount,
        appliedQueryFilters: this.appliedQueryFilters,
        ...data
      };
      return super.addChild(resultsHeaderData, type, opts);
    }
    return super.addChild(data, type, opts);
  }
}
