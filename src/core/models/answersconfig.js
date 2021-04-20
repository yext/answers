/** @module AnswersConfig */
import SearchConfig from '../models/searchconfig';
import VerticalPagesConfig from '../models/verticalpagesconfig';

/**
 * AnswersConfig is a model that is used to turn a raw configuration into a data model.
 * It is used to initialize the Answers SDK
 */
export default class AnswersConfig {
  constructor (rawConfig) {
    /**
     * Required, the Yext Answers API Key
     * @type {string}
     */
    this.apiKey = rawConfig.apiKey;

    /**
     * The internal Yext environment
     * @type {string}
     */
    this.environment = rawConfig.environment;

    /**
     * Required, the key used for your Answers Experience
     * @type {string}
     */
    this.experienceKey = rawConfig.experienceKey;

    /**
     * Optional, initialize components here, invoked when the Answers component library is
     * loaded/ready. If components are not added here, they can also be added when the init
     * promise resolves
     * @type {function}
     */
    this.onReady = rawConfig.onReady;

    /**
     * Optional, Yext businessId, required to send analytics events
     * @type {string}
     */
    this.businessId = rawConfig.businessId;

    /**
     * Optional, if false, the library will not fetch pre-made templates. Only change this to false if you provide a
     *  template bundle in the `templateBundle` config option or implement custom renders for every component
     * @type {boolean}
     */
    this.useTemplates = rawConfig.useTemplates;

    /**
     * Optional, additional templates to register with the renderer
     * @type {Object}
     */
    this.templateBundle = rawConfig.templateBundle;

    /**
     * Optional, provide configuration for each vertical that is shared across components
     * @type {VerticalPagesConfig}
     */
    this.verticalPages = new VerticalPagesConfig(rawConfig.verticalPages);

    /**
     * Optional, search specific settings
     * @type {SearchConfig}
     */
    this.search = new SearchConfig(rawConfig.search);

    /**
     * Optional, vertical no results settings. See Vertical No Results
     * @type {Object}
     */
    this.noResults = rawConfig.noResults;

    /**
     * Optional, the locale will affect how queries are interpreted and the results returned. Defaults to 'en'
     * @type {string}
     */
    this.locale = rawConfig.locale;

    /**
     * Optional, the Answers Experience version to use for api requests
     * @type {string}
     */
    this.experienceVersion = rawConfig.experienceVersion;

    /**
     * Optional, prints full Answers error details when set to true.
     * @type {boolean}
     */
    this.debug = rawConfig.debug;

    /**
     * Optional, If true, the search session is tracked. If false, there is no tracking. Defaults to true.
     * @type {boolean}
     */
    this.sessionTrackingEnabled = rawConfig.sessionTrackingEnabled;

    /**
     * Optional, invoked when the state of any component changes
     * @type {function()}
     */
    this.onStateChange = rawConfig.onStateChange;

    /**
     * Optional, analytics callback after a vertical search
     * @type {function()}
     */
    this.onVerticalSearch = rawConfig.onVerticalSearch;

    /**
     * Optional, analytics callback after a universal search
     * @type {function()}
     */
    this.onUniversalSearch = rawConfig.onUniversalSearch;

    /**
     * Optional, opt-out of automatic css variable resolution on init for legacy browsers
     * @type {boolean}
     */
    this.disableCssVariablesPonyfill = rawConfig.disableCssVariablesPonyfill;

    /**
     * Optional, the analytics key describing the Answers integration type.
     * Accepts 'STANDARD' or 'OVERLAY'
     * @type {string}
     */
    this.querySource = rawConfig.querySource;

    /**
     * Used to signify if mocked versions of services should be used
     * @type{boolean}
     */
    this.useMock = rawConfig.mock;

    /**
     * Global options to include with every analytic event reported to the server
     * @type {Object}
     */
    this.analyticsOptions = rawConfig.analyticsOptions;

    /**
     * A map of field formatters used to format results, if present
     * @type {Object}
     */
    this.fieldFormatters = rawConfig.fieldFormatters;

    Object.freeze(this);
  }
}
