import { AnswersConfigError } from '../errors/errors';

/** @module SearchConfig */

export default class SearchConfig {
  constructor (config = {}) {
    // The max results per search.
    // Also defines the number of results per page, if pagination is enabled
    this.limit = config.limit || 20;

    this.validate();
    Object.freeze(this);
  }

  validate () {
    if (typeof this.limit !== 'number' || this.limit < 1 || this.limit > 50) {
      throw new AnswersConfigError('Search Limit must be between 1 and 50', 'SearchConfig');
    }
  }
}
