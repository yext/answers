/** @module FilterOptionsComponent */

import Component from '../component';
import { AnswersComponentError } from '../../../core/errors/errors';
import Filter from '../../../core/models/filter';
import DOM from '../../dom/dom';

/**
 * The currently supported controls
 * @type {string[]}
 */
const SUPPORTED_CONTROLS = [
  'singleoption',
  'multioption'
];

/**
 * Renders a set of options, each one representing a filter in a search.
 */
export default class FilterOptionsComponent extends Component {
  constructor (config = {}) {
    super(config);

    if (!config.control || !SUPPORTED_CONTROLS.includes(config.control)) {
      throw new AnswersComponentError(
        'FilterOptions requires a valid "control" to be provided',
        'FilterOptions');
    }

    if (!config.options) {
      throw new AnswersComponentError(
        'FilterOptions component requires options to be provided',
        'FilterOptions');
    }

    /**
     * The list of filter options to display with checked status
     * @type {object[]}
     * @private
     */
    this._options = config.options.map(o => Object.assign({}, { selected: false }, o));

    /**
     * The type of control to display
     * @type {string}
     * @private
     */
    this._control = config.control;

    /**
     * The selector used for options in the template
     * @type {string}
     * @private
     */
    this._optionSelector = config.optionSelector || '.js-yext-filter-option';

    /**
     * If true, stores the filter to storage on each change
     * @type {boolean}
     * @private
     */
    this._storeOnChange = config.storeOnChange || false;

    /**
     * The callback function to call when changed
     * @type {function}
     * @private
     */
    this._onChange = config.onChange || function () {};

    this._label = config.label || '';

    /**
     * The label to be used in the legend
     * @type {string}
     * @private
     */
    this._label = config.label || 'Filters';
  }

  static get type () {
    return 'FilterOptions';
  }

  /**
   * The template to render, based on the control
   * @returns {string}
   * @override
   */
  static defaultTemplateName (config) {
    return `controls/${config.control}`;
  }

  setState (data) {
    super.setState(Object.assign({}, data, {
      name: this.name.toLowerCase(),
      options: this._options,
      label: this._label
    }));
  }

  onMount () {
    DOM.delegate(
      DOM.query(this._container, `.${this._control}-fieldset`),
      this._optionSelector,
      'click',
      event => {
        this._updateOption(parseInt(event.target.dataset.index), event.target.checked);

        const filter = this._buildFilter();
        if (this._storeOnChange) {
          this.core.setFilter(this.name, filter);
        }

        this._onChange(filter);
      });
  }

  _updateOption (index, selected) {
    if (this._control === 'singleoption') {
      this._options = this._options.map(o => Object.assign({}, o, { selected: false }));
    }

    this._options[index] = Object.assign({}, this._options[index], { selected });
    this.setState();
  }

  getFilter () {
    return this._buildFilter();
  }

  /**
   * Clear all options
   */
  clear () {
    const elements = DOM.queryAll(this._container, this._optionSelector);
    elements.forEach(e => e.setAttribute('checked', 'false'));
    this._applyFilter();
  }

  /**
   * Build and return the Filter that represents the current state
   * @returns {Filter}
   * @private
   */
  _buildFilter () {
    const filters = this._options
      .filter(o => o.selected)
      .map(o => o.filter
        ? o.filter
        : Filter.equal(o.field, o.value));

    return filters.length > 0
      ? Filter.group(...filters)
      : {};
  }
}
