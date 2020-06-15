/** @module UniversalResultsComponent */

import Component from '../component';

import StorageKeys from '../../../core/storage/storagekeys';
import SearchStates from '../../../core/storage/searchstates';
import AccordionResultsComponent from './accordionresultscomponent.js';
import { defaultConfigOption } from '../../../core/utils/configutils';

export default class UniversalResultsComponent extends Component {
  constructor (config = {}, systemConfig = {}) {
    super(config, systemConfig);
    this.moduleId = StorageKeys.UNIVERSAL_RESULTS;
  }

  static get type () {
    return 'UniversalResults';
  }

  static defaultTemplateName (config) {
    return 'results/universalresults';
  }

  static areDuplicateNamesAllowed () {
    return true;
  }

  setState (data, val) {
    const sections = data.sections || [];
    const searchState = data.searchState || SearchStates.PRE_SEARCH;
    return super.setState(Object.assign(data, {
      isPreSearch: searchState === SearchStates.PRE_SEARCH,
      isSearchLoading: searchState === SearchStates.SEARCH_LOADING,
      isSearchComplete: searchState === SearchStates.SEARCH_COMPLETE,
      showNoResults: sections.length === 0,
      query: this.core.globalStorage.getState(StorageKeys.QUERY),
      sections: sections
    }, val));
  }

  addChild (data = {}, type, opts) {
    const verticals = this._config.verticals || this._config.config || {};
    const verticalKey = data.verticalConfigId;
    const childOpts = {
      ...opts,
      ...UniversalResultsComponent.getChildConfig(verticalKey, verticals[verticalKey] || {})
    };
    const childType = childOpts.useAccordion ? AccordionResultsComponent.type : type;
    return super.addChild(data, childType, childOpts);
  }

  /**
   * Applies synonyms and default config for a vertical in universal results.
   * @param {string} verticalKey
   * @param {Object} config
   */
  static getChildConfig (verticalKey, config) {
    return {
      // Tells vertical results it is in a universal results page.
      isUniversal: true,
      // Label for the vertical in the titlebar.
      title: config.sectionTitle || verticalKey,
      // Icon in the titlebar
      icon: config.sectionTitleIconName || config.sectionTitleIconUrl || 'star',
      // Url that links to the vertical search for this vertical.
      verticalURL: 'url' in config ? config.url : verticalKey + '.html',
      // Show a view more link by default, which also links to verticalURL.
      viewMore: true,
      // By default, the view more link has a label of 'View More'.
      viewMoreLabel: defaultConfigOption(config, ['viewMoreLabel', 'viewAllText'], 'View More'),
      // Whether to show a result count.
      showResultCount: false,
      // Whether to use AccordionResults (DEPRECATED)
      useAccordion: false,
      ...config,
      // Config for the applied filters bar. Must be placed after ...config to not override defaults.
      appliedFilters: {
        // Whether to display applied filters.
        show: defaultConfigOption(config, ['appliedFilters.show', 'showAppliedFilters'], true),
        // Whether to show field names, e.g. Location in Location: Virginia.
        showFieldNames: defaultConfigOption(config, ['appliedFilters.showFieldNames', 'showFieldNames'], false),
        // Hide filters with these field ids.
        hiddenFields: defaultConfigOption(config, ['appliedFilters.hiddenFields', 'hiddenFields'], ['builtin.entityType']),
        // Symbol placed between the result count and the applied filters.
        resultsCountSeparator: defaultConfigOption(config, ['appliedFilters.resultsCountSeparator', 'resultsCountSeparator'], '|'),
        // Whether to show a 'change filters' link, linking back to verticalURL.
        showChangeFilters: defaultConfigOption(config, ['appliedFilters.showChangeFilters', 'showChangeFilters'], false),
        // The symbol placed between different filters with the same fieldName. e.g. Location: Virginia | New York | Miami.
        delimiter: defaultConfigOption(config, ['appliedFilters.delimiter'], '|'),
        // The aria-label given to the applied filters bar.
        labelText: defaultConfigOption(config, ['appliedFilters.labelText'], 'Filters applied to this search:')
      }
    };
  }
}
