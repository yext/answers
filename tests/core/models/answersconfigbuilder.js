import { AnswersConfigError } from '../../../src/core/errors/errors';
import { LOCALE, PRODUCTION, QUERY_SOURCE, SANDBOX } from '../../../src/core/constants';
import AnswersConfigBuilder from '../../../src/core/models/answersconfigbuilder';

describe('constructing AnswersConfig', () => {
  const key = 'someRandomKey';
  it('throws an error when the api key is missing from the raw answers config', () => {
    const config = {
      experienceKey: key
    };
    const buildingAnswersConfig = () => new AnswersConfigBuilder().setRawConfig(config).build();
    expect(buildingAnswersConfig).toThrow(AnswersConfigError);
    expect(buildingAnswersConfig).toThrow('Missing required `apiKey`. Type must be {string}');
  });

  it('throws an error when the experienceKey key is missing from the raw answers config', () => {
    const config = {
      apiKey: key
    };
    const buildingAnswersConfig = () => new AnswersConfigBuilder().setRawConfig(config).build();
    expect(buildingAnswersConfig).toThrow(AnswersConfigError);
    expect(buildingAnswersConfig).toThrow('Missing required `experienceKey`. Type must be {string}');
  });

  it('throws an error when onStateChange is not a function', () => {
    const config = {
      apiKey: key,
      experienceKey: key,
      onStateChange: 'not a function'
    };
    const buildingAnswersConfig = () => new AnswersConfigBuilder().setRawConfig(config).build();
    expect(buildingAnswersConfig).toThrow(AnswersConfigError);
    expect(buildingAnswersConfig).toThrow('onStateChange must be a function. Current type is: string');
  });

  it('throws an error when onVerticalSearch is not a function', () => {
    const config = {
      apiKey: key,
      experienceKey: key,
      onVerticalSearch: 'not a function'
    };
    const buildingAnswersConfig = () => new AnswersConfigBuilder().setRawConfig(config).build();
    expect(buildingAnswersConfig).toThrow(AnswersConfigError);
    expect(buildingAnswersConfig).toThrow('onVerticalSearch must be a function. Current type is: string');
  });

  it('throws an error when onUniversalSearch is not a function', () => {
    const config = {
      apiKey: key,
      experienceKey: key,
      onUniversalSearch: 'not a function'
    };
    const buildingAnswersConfig = () => new AnswersConfigBuilder().setRawConfig(config).build();
    expect(buildingAnswersConfig).toThrow(AnswersConfigError);
    expect(buildingAnswersConfig).toThrow('onUniversalSearch must be a function. Current type is: string');
  });

  it('throws an error when sessionTrackingEnabled is not a boolean', () => {
    const config = {
      apiKey: key,
      experienceKey: key,
      sessionTrackingEnabled: 'not a boolean'
    };
    const buildingAnswersConfig = () => new AnswersConfigBuilder().setRawConfig(config).build();
    expect(buildingAnswersConfig).toThrow(AnswersConfigError);
    expect(buildingAnswersConfig).toThrow('sessionTrackingEnabled must be a boolean. Current type is: string');
  });

  it('properly handles the inclusion of sandboxPrefix in the apiKey', () => {
    const config = {
      apiKey: `${SANDBOX}-${key}`,
      experienceKey: key
    };
    const answersConfig = new AnswersConfigBuilder().setRawConfig(config).build();
    expect(answersConfig.apiKey).toBe(key);
    expect(answersConfig.environment).toBe(SANDBOX);
  });

  it('has defaults properly applied', () => {
    const config = {
      apiKey: key,
      experienceKey: key
    };

    const answersConfig = new AnswersConfigBuilder().setRawConfig(config).build();
    expect(answersConfig.environment).toBe(PRODUCTION);
    expect(typeof answersConfig.onReady).toBe('function');
    expect(answersConfig.locale).toBe(LOCALE);
    expect(answersConfig.experienceVersion).toBe('PRODUCTION');
    expect(answersConfig.debug).toBe(false);
    expect(answersConfig.sessionTrackingEnabled).toBe(true);
    expect(typeof answersConfig.onStateChange).toBe('function');
    expect(typeof answersConfig.onVerticalSearch).toBe('function');
    expect(typeof answersConfig.onUniversalSearch).toBe('function');
    expect(answersConfig.disableCssVariablesPonyfill).toBe(false);
    expect(answersConfig.querySource).toBe(QUERY_SOURCE);
  });

  it('has defaults to not override explicitly declared parameters', () => {
    const correctFunction = () => 'correct function';
    const config = {
      apiKey: key,
      experienceKey: key,
      environment: SANDBOX,
      onReady: correctFunction,
      useTemplates: false,
      locale: 'new locale',
      experienceVersion: 'SANDBOX',
      debug: true,
      sessionTrackingEnabled: false,
      onStateChange: correctFunction,
      onVerticalSearch: correctFunction,
      onUniversalSearch: correctFunction,
      disableCssVariablesPonyfill: true,
      querySource: 'CUSTOM'
    };

    const answersConfig = new AnswersConfigBuilder().setRawConfig(config).build();
    expect(answersConfig.environment).toBe(SANDBOX);
    expect(answersConfig.onReady).toBe(correctFunction);
    expect(answersConfig.locale).toBe('new locale');
    expect(answersConfig.experienceVersion).toBe('SANDBOX');
    expect(answersConfig.debug).toBe(true);
    expect(answersConfig.sessionTrackingEnabled).toBe(false);
    expect(answersConfig.onStateChange).toBe(correctFunction);
    expect(answersConfig.onVerticalSearch).toBe(correctFunction);
    expect(answersConfig.onUniversalSearch).toBe(correctFunction);
    expect(answersConfig.disableCssVariablesPonyfill).toBe(true);
    expect(answersConfig.querySource).toBe('CUSTOM');
  });
});
