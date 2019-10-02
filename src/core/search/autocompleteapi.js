/** @module AutoCompleteApi */

import ApiRequest from '../http/apirequest';
import AutoCompleteDataTransformer from './autocompletedatatransformer';
import { AnswersBasicError, AnswersEndpointError } from '../errors/errors';

/**
 * AutoCompleteApi exposes an interface for network related matters
 * for all the autocomplete endpoints.
 */
export default class AutoCompleteApi {
  constructor (config = {}) {
    /**
     * The API Key to use for the request
     * @type {string}
     * @private
     */
    if (!config.apiKey) {
      throw new AnswersBasicError('Api Key is required', 'AutoComplete');
    }
    this._apiKey = config.apiKey;

    /**
     * The Answers Key to use for the request
     * @type {string}
     * @private
     */
    if (!config.answersKey) {
      throw new AnswersBasicError('Answers Key is required', 'AutoComplete');
    }
    this._answersKey = config.answersKey;

    /**
     * The version of the API to make a request to
     * @type {string}
     * @private
     */
    this._version = config.version || 20190101 || 20190301;

    /**
     * The answers config version to use for all requests
     * @type {string}
     * @private
     */
    this._configVersion = config.configVersion;

    /**
     * The locale to use for the request
     * @type {string}
     * @private
     */
    if (!config.locale) {
      throw new AnswersBasicError('Locale is required', 'AutoComplete');
    }
    this._locale = config.locale;
  }

  /**
   * Autocomplete filters
   * @param {string} input The input to use for auto complete
   * @param {string} verticalKey The vertical key for the config
   * @param {string} barKey The bar key for the config v1
   * @param {object} searchParameters The search parameters for the config v2
   */
  queryFilter (input, verticalKey, barKey, searchParameters) {
    let request = new ApiRequest({
      endpoint: '/v2/accounts/me/answers/filtersearch',
      apiKey: this._apiKey,
      version: this._version,
      params: {
        'input': input,
        'answersKey': this._answersKey,
        'version': this._configVersion,
        'verticalKey': verticalKey,
        'inputKey': barKey,
        'locale': this._locale,
        'search_parameters': JSON.stringify(searchParameters)
      }
    });

    return request.get()
      .then(response => response.json())
      .then(response => AutoCompleteDataTransformer.filter(response.response, barKey))
      .catch(error => {
        throw new AnswersEndpointError('Filter search request failed', 'AutoComplete', error);
      });
  }

  queryVertical (input, verticalKey, barKey) {
    let request = new ApiRequest({
      endpoint: '/v2/accounts/me/answers/vertical/autocomplete',
      apiKey: this._apiKey,
      version: this._version,
      params: {
        'input': input,
        'answersKey': this._answersKey,
        'version': this._configVersion,
        'verticalKey': verticalKey,
        'barKey': barKey,
        'locale': this._locale
      }
    });

    return request.get()
      .then(response => response.json())
      .then(response => AutoCompleteDataTransformer.vertical(response.response, request._params.barKey))
      .catch(error => {
        throw new AnswersEndpointError('Vertical search request failed', 'AutoComplete', error);
      });
  }

  queryUniversal (queryString) {
    let request = new ApiRequest({
      endpoint: '/v2/accounts/me/answers/autocomplete',
      apiKey: this._apiKey,
      version: this._version,
      params: {
        'input': queryString,
        'answersKey': this._answersKey,
        'version': this._configVersion,
        'locale': this._locale
      }
    });

    return request.get(queryString)
      .then(response => response.json())
      .then(response => AutoCompleteDataTransformer.universal(response.response))
      .catch(error => {
        throw new AnswersEndpointError('Universal search request failed', 'AutoComplete', error);
      });
  }
}
