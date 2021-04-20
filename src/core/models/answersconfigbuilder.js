import { LOCALE, PRODUCTION, QUERY_SOURCE, SANDBOX } from '../constants';
import { AnswersConfigError } from '../errors/errors';
import AnswersConfig from './answersconfig';

const sandboxPrefix = `${SANDBOX}-`;
const DEFAULTS = {
  environment: PRODUCTION,
  onReady: function () {},
  useTemplates: true,
  locale: LOCALE,
  experienceVersion: 'PRODUCTION',
  debug: false,
  sessionTrackingEnabled: true,
  onStateChange: function () {},
  onVerticalSearch: function () {},
  onUniversalSearch: function () {},
  disableCssVariablesPonyfill: false,
  querySource: QUERY_SOURCE
};

/**
 * AnswersConfigBuilder builds a valid AnswersConfig object, validating a rawConfig before defaults are applied.
 */
export default class AnswersConfigBuilder {
  setRawConfig (rawConfig) {
    this.rawConfig = rawConfig;
    return this;
  }

  /**
   * Validates and builds the Answers config object to ensure things like api key and experience key are
   * properly set. A helpful error message is thrown when the rawConfig fails validation. Any options in rawConfig
   * not supplied by the user are given default values.
   */
  build () {
    if (this.rawConfig === undefined) {
      throw new AnswersConfigError('You must supply a configuration', 'AnswersConfigBuilder');
    }
    if (this.rawConfig.apiKey === undefined || typeof this.rawConfig.apiKey !== 'string') {
      throw new AnswersConfigError('Missing required `apiKey`. Type must be {string}', 'AnswersConfigBuilder');
    }

    if (this.rawConfig.experienceKey === undefined || typeof this.rawConfig.experienceKey !== 'string') {
      throw new AnswersConfigError('Missing required `experienceKey`. Type must be {string}', 'AnswersConfigBuilder');
    }

    if (this.rawConfig.onStateChange && typeof this.rawConfig.onStateChange !== 'function') {
      throw new AnswersConfigError('onStateChange must be a function. Current type is: ' + typeof this.rawConfig.onStateChange, 'AnswersConfigBuilder');
    }

    if (this.rawConfig.onVerticalSearch && typeof this.rawConfig.onVerticalSearch !== 'function') {
      throw new AnswersConfigError('onVerticalSearch must be a function. Current type is: ' + typeof this.rawConfig.onVerticalSearch, 'AnswersConfigBuilder');
    }

    if (this.rawConfig.onUniversalSearch && typeof this.rawConfig.onUniversalSearch !== 'function') {
      throw new AnswersConfigError('onUniversalSearch must be a function. Current type is: ' + typeof this.rawConfig.onUniversalSearch, 'AnswersConfigBuilder');
    }

    if (this.rawConfig.sessionTrackingEnabled !== undefined && typeof this.rawConfig.sessionTrackingEnabled !== 'boolean') {
      throw new AnswersConfigError('sessionTrackingEnabled must be a boolean. Current type is: ' + typeof this.rawConfig.sessionTrackingEnabled, 'AnswersConfigBuilder');
    }

    // Apply default values to the rawConfig before creating the AnswersConfig object
    const rawConfig = Object.assign({}, DEFAULTS, this.rawConfig);

    // Update apiKey and environment values if sandboxPrefix is included
    if (rawConfig.apiKey.includes(sandboxPrefix)) {
      rawConfig.apiKey = rawConfig.apiKey.replace(sandboxPrefix, '');
      rawConfig.environment = SANDBOX;
    }
    return new AnswersConfig(rawConfig);
  }
}
