/** @module ResultsItemComponent */

import Component from '../component';

export default class ResultsItemComponent extends Component {
  constructor (opts = {}, systemConfig = {}) {
    super(opts, systemConfig);

    /**
     * verticalConfigId used for analytics and passed to children
     * @type {string}
     * @private
     */
    this._verticalConfigId = opts.verticalConfigId;

    /**
     * isUniversal is used for analytics and passed to children and is set to
     * true if this component is added by the UniversalResultsComponent
     * @type {boolean}
     * @private
     */
    this._isUniversal = opts.isUniversal || false;
  }

  static get type () {
    return 'ResultsItemComponent';
  }

  /**
   * The template to render
   * @returns {string}
   * @override
   */
  static defaultTemplateName (config) {
    return 'results/resultsitem';
  }

  static areDuplicateNamesAllowed () {
    return true;
  }

  /**
   * helper to construct the eventOptions object for the title link
   * @param entityId The ID of the result item, if present
   * @param url The url of the result item, if present
   * @returns {string}
   */
  eventOptions (entityId, url) {
    const options = {
      verticalConfigId: this._verticalConfigId,
      searcher: this._isUniversal ? 'UNIVERSAL' : 'VERTICAL'
    };

    if (entityId) {
      options.entityId = entityId;
    } else {
      options.url = url;
    }

    return JSON.stringify(options);
  }

  /**
   * passes eventOptions to the viewModel
   * @override
   * @param data
   * @returns {ResultsItemComponent}
   */
  setState (data) {
    return super.setState(Object.assign(data, {
      eventOptions: this.eventOptions(data.id, data.link)
    }));
  }
}