/** @module EventResultsItemComponent */

import ResultsItemComponent from './resultsitemcomponent';

export default class EventResultsItemComponent extends ResultsItemComponent {
  constructor (opts = {}, systemConfig = {}) {
    super(opts, systemConfig);
  }

  static get type () {
    return 'EventResultsItemComponent';
  }

  /**
   * The template to render
   * @returns {string}
   * @override
   */
  static defaultTemplateName (config) {
    return 'results/eventresultsitem';
  }

  static areDuplicateNamesAllowed () {
    return true;
  }
}