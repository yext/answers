/** @module DateFilterComponent */

import Component from '../component';
import FilterView from '../../../core/models/filterview';
import DOM from '../../dom/dom';
import Filter from '../../../core/models/filter';
import FilterMetadata from '../../../core/models/filtermetadata';

/**
 * A filter for a range of dates
 */
export default class DateRangeFilterComponent extends Component {
  constructor (config = {}, systemConfig = {}) {
    super(config, systemConfig);

    /**
     * The api field this filter controls
     * @type {string}
     * @private
     */
    this._field = config.field;

    /**
     * The title to display for the date range
     * @type {string}
     * @private
     */
    this._title = config.title;

    /**
     * The optional label to show for the min date input
     * @type {string}
     * @private
     */
    this._minLabel = config.minLabel || null;

    /**
     * The optional label to show for the max date input
     * @type {string}
     * @private
     */
    this._maxLabel = config.maxLabel || null;

    /**
     * The callback used when a date is changed
     * @type {function}
     * @private
     */
    this._onChange = config.onChange || function () {};

    /**
     * If true, stores the filter to storage on each change
     * @type {boolean}
     * @private
     */
    this._storeOnChange = config.storeOnChange === undefined ? true : config.storeOnChange;

    /**
     * If true, this filter represents an exclusive range, rather than an inclusive one
     * @type {boolean}
     * @private
     */
    this._isExclusive = config.isExclusive;

    /**
     * The template for this component
     * @private
     */
    this._templateName = `controls/date`;

    const today = new Date();
    const todayString = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}-${`${today.getDate()}`.padStart(2, '0')}`;
    const minDate = this.core.globalStorage.getState(`${this.name}.min`);
    const maxDate = this.core.globalStorage.getState(`${this.name}.max`);

    /**
     * The current date range
     * @private
     */
    this._date = {
      min: minDate || config.initialMin || todayString,
      max: maxDate || config.initialMax || todayString
    };
  }

  static get type () {
    return 'DateRangeFilter';
  }

  setState (data) {
    super.setState(Object.assign({}, data, {
      name: this.name,
      title: this._title,
      minLabel: this._minLabel,
      maxLabel: this._maxLabel,
      dateMin: this._date.min,
      dateMax: this._date.max
    }));
  }

  onCreate () {
    DOM.delegate(this._container, '.js-yext-date', 'change', (event) => {
      this._updateRange(event.target.dataset.key, event.target.value);
    });
  }

  /**
   * Set the min date to the one provided
   * @param {string} date Date to set in yyyy-mm-dd string format
   */
  setMin (date) {
    this._updateRange('min', date);
  }

  /**
   * Set the max date to the one provided
   * @param {string} date Date to set in yyyy-mm-dd string format
   */
  setMax (date) {
    this._updateRange('max', date);
  }

  getFilterView () {
    return this._buildFilterView();
  }

  /**
   * Updates the current state of the date range
   * @param {string} key The key for the date value
   * @param {string} value The string date value
   * @private
   */
  _updateRange (key, value) {
    this._date = Object.assign({}, this._date, { [key]: value });
    this.setState();

    const filterView = this._buildFilterView();
    if (this._storeOnChange) {
      this.core.setFilterView(this.name, filterView);
    }
    this.core.persistentStorage.set(`${this.name}.min`, this._date.min);
    this.core.persistentStorage.set(`${this.name}.max`, this._date.max);

    this._onChange(filterView.filter, filterView.metadata);
  }

  /**
   * Construct an api filter view with the current date state
   * @private
   */
  _buildFilterView () {
    if (this._date.min === '' || this._date.max === '') {
      return {};
    }
    const metadata = FilterMetadata.from(this._field, this._title, `${this._date.min} - ${this._date.max}`);
    return this._isExclusive
      ? new FilterView(Filter.exclusiveRange(this._field, this._date.min, this._date.max), metadata)
      : new FilterView(Filter.inclusiveRange(this._field, this._date.min, this._date.max), metadata);
  }
}
