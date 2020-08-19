import { getNPlurals, getPluralFunc } from 'plural-forms/dist/minimal';

export default class Translator {
  /**
   * Performs a translation which supports
   * interpolation, pluralization, or both
   * @param {string} translations The translations, or a stringified JSON of possible translations
   * @param {Object} interpolationParams Params to use during interpolation
   * @param {number} count The count associated with the pluralization
   */
  static translate (translations, interpolationParams, count) {
    const stringToInterpolate = this._selectPluralization(translations, count);
    return this._interpolate(stringToInterpolate, interpolationParams);
  }

  /**
   * If translations is json, parse it and choose the correct plural form. Otherwise it is
   * just a the non-interpolated translation string.
   * @param {string} translations
   * @param {number} count
   * @returns {string}
   */
  static _selectPluralization (translations, count) {
    try {
      translations = JSON.parse(translations);
    } catch (e) {
      return translations;
    }
    return this._selectPluralForm(translations, count);
  }

  /**
   * Returns the correct plural form given a parsed translations object and count.
   * @param {Object} parsedTranslations
   * @param {number} count
   * @returns {string}
   */
  static _selectPluralForm (parsedTranslations, count) {
    const locale = parsedTranslations.locale;
    const oneToNArray = this._generateArrayOneToN(locale);
    const pluralFormIndex = getPluralFunc(locale)(count, oneToNArray);
    return parsedTranslations[pluralFormIndex];
  }

  /**
   * @param {string} locale
   * @returns {Array} an array of the form [0, 1, 2, ..., nPluralForms]
   */
  static _generateArrayOneToN (locale) {
    const numberOfPluralForms = getNPlurals(locale);
    return Array.from((new Array(numberOfPluralForms)).keys());
  }

  static _interpolate (stringToInterpolate, interpolationParams) {
    const interpolationRegex = new RegExp(/\[\[([a-zA-Z0-9]+)\]\]/, 'g');

    return stringToInterpolate.replace(interpolationRegex, (match, interpolationKey) => {
      return interpolationParams[interpolationKey];
    });
  }
}