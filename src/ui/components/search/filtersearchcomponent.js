/** @module FilterSearchComponent */

import Component from '../component';
import DOM from '../../dom/dom';
import StorageKeys from '../../../core/storage/storagekeys';
import Filter from '../../../core/models/filter';
import SearchParams from '../../dom/searchparams';
import buildSearchParameters from '../../tools/searchparamsparser';
import FilterNodeFactory from '../../../core/filters/filternodefactory';

/**
 * FilterSearchComponent is used for autocomplete using the FilterSearch backend.
 * It'll allow you to pick pre-set filters that are setup on the backend within
 * a vertical search context.
 *
 * @extends Component
 */
export default class FilterSearchComponent extends Component {
  constructor (config = {}, systemConfig = {}) {
    super(config, systemConfig);

    /**
     * The vertical key for vertical search configuration
     * @type {string}
     */
    this._verticalKey = config.verticalKey || null;

    /**
     * If true, store the filter value but do not search on change
     * @type {boolean}
     * @private
     */
    this._storeOnChange = config.storeOnChange || false;

    /**
     * Query submission is based on a form as context.
     * Optionally provided, otherwise defaults to native form node within container
     * @type {string} CSS selector
     */
    this._formEl = config.formSelector || 'form';

    /**
     * The input element used for searching and wires up the keyboard interaction
     * Optionally provided.
     * @type {string} CSS selector
     */
    this._inputEl = config.inputEl || '.js-yext-query';

    /**
     * The title used, provided to the template as a data point
     * Optionally provided.
     * @type {string}
     */
    this.title = config.title;

    /**
     * The search text used for labeling the input box, also provided to template.
     * Optionally provided
     * @type {string}
     */
    this.searchText = config.searchText || 'What are you interested in?';

    /**
     * The query text to show as the first item for auto complete.
     * Optionally provided
     * @type {string}
     */
    this.promptHeader = config.promptHeader || null;

    /**
     * Auto focuses the input box if set to true.
     * Optionally provided, defaults to false.
     * @type {boolean}
     */
    this.autoFocus = config.autoFocus === true;

    /**
     * submitURL will force the search query submission to get
     * redirected to the URL provided.
     * Optional, defaults to null.
     *
     * If no redirectUrl provided, we keep the page as a single page app.
     *
     * @type {boolean}
     */
    this.redirectUrl = config.redirectUrl || null;

    /**
     * The query string to use for the input box, provided to template for rendering.
     * Optionally provided
     * @type {string}
     */
    this.query = config.query || this.core.globalStorage.getState(`${this.name}.${StorageKeys.QUERY}`) || '';
    this.core.globalStorage.on('update', `${this.name}.${StorageKeys.QUERY}`, q => {
      this.query = q;
      this.search();
    });

    /**
     * The filter string to use for the provided query
     * Optionally provided
     * TODO(oshi): config.filter is not in the readme. Do we need this?
     * @type {string}
     */
    let filter = config.filter || '';
    if (typeof filter === 'string') {
      try {
        filter = JSON.parse(filter);
      } catch (e) {}
    }

    let filterNode = this.core.globalStorage.getState(`${this.name}.${StorageKeys.STATIC_FILTER_NODE}`) || {};
    if (typeof filterNode === 'string') {
      try {
        filterNode = JSON.parse(filterNode);
      } catch (e) {}
    }

    if (filter) {
      this.filterNode = FilterNodeFactory.from({
        ...filterNode,
        filter: filter
      });
    } else {
      this.filterNode = FilterNodeFactory.from({ ...filterNode });
    }

    this.searchParameters = buildSearchParameters(config.searchParameters);
  }

  static get type () {
    return 'FilterSearch';
  }

  /**
   * The template to render
   * @returns {string}
   * @override
   */
  static defaultTemplateName () {
    return 'search/filtersearch';
  }

  // TODO(oshi): SPR-1925 check that it is safe to remove this, it runs an extra search
  // For no obvious reasons
  onCreate () {
    if (this.query && this.filter) {
      this.search();
    }
  }

  onMount () {
    // Wire up our search handling and auto complete
    this.initAutoComplete(this._inputEl);

    if (this.autoFocus === true && this.query.length === 0) {
      DOM.query(this._container, this._inputEl).focus();
    }
  }

  /**
   * A helper method to wire up our auto complete on an input selector
   * @param {string} inputSelector CSS selector to bind our auto complete component to
   */
  initAutoComplete (inputSelector) {
    this._inputEl = inputSelector;

    this.componentManager.create('AutoComplete', {
      parentContainer: this._container,
      name: `${this.name}.autocomplete`,
      isFilterSearch: true,
      container: '.yxt-SearchBar-autocomplete',
      promptHeader: this.promptHeader,
      originalQuery: this.query,
      originalFilter: this.filter,
      inputEl: inputSelector,
      verticalKey: this._verticalKey,
      searchParameters: this.searchParameters,
      onSubmit: (query, filter) => {
        this.query = query;
        this.filterNode = FilterNodeFactory.from({
          filter: Filter.fromResponse(filter),
          metadata: {
            fieldName: this.title,
            displayValue: `"${query}"`
          }
        });

        const params = new SearchParams(window.location.search.substring(1));
        params.set(`${this.name}.${StorageKeys.QUERY}`, this.query);
        params.set(`${this.name}.${StorageKeys.STATIC_FILTER_NODE}`, this.filterNode);

        // If we have a redirectUrl, we want the params to be
        // serialized and submitted.
        if (typeof this.redirectUrl === 'string') {
          window.location.href = this.redirectUrl + '?' + params.toString();
          return false;
        }

        // save the filter to storage for the next search
        this.core.persistentStorage.set(`${this.name}.${StorageKeys.QUERY}`, this.query);
        this.core.persistentStorage.set(`${this.name}.${StorageKeys.STATIC_FILTER_NODE}`, this.filterNode);
        this.core.setStaticFilterNode(this.name, this.filterNode);
        this.search();
      }
    });
  }

  /**
   * Perform the vertical search with all saved filters and query,
   * optionally redirecting based on config
   */
  search () {
    if (this._storeOnChange) {
      return;
    }
    this.core.verticalSearch(this._config.verticalKey, {
      resetPagination: true,
      useFacets: true
    });
  }

  setState (data) {
    return super.setState(Object.assign({
      title: this.title,
      searchText: this.searchText,
      query: this.query,
      filter: this.filter
    }, data));
  }
}
