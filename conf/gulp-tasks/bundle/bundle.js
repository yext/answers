const { dest } = require('gulp');

const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const replace = require('gulp-replace');
const resolve = require('rollup-plugin-node-resolve');
const rollup = require('gulp-rollup-lightweight');
const source = require('vinyl-source-stream');
const { TRANSLATION_FLAGGER_REGEX } = require('../../i18n/constants');

const TranslateCallParser = require('../../i18n/translatecallparser');

/**
 * The Gulp task for producing the modern version of the SDK bundle.
 *
 * @param {Function} callback
 * @param {Object<string, ?>} outputConfig Any variant-specific configuration
 *                                         for the modern bundle.
 * @param {string} bundleName The name of the created bundle.
 * @param {string} locale The current locale
 * @param {string} libVersion The current JS library version
 * @param {TranslationResolver} translationResolver
 *
 * @returns {stream.Writable} A {@link Writable} stream containing the modern
 *                            SDK bundle.
 */
exports.modernBundle = function (callback, outputConfig, bundleName, locale, libVersion, translationResolver) {
  const rollupConfig = {
    input: './src/answers-umd.js',
    output: outputConfig,
    plugins: [
      resolve({ browser: true }),
      commonjs({
        include: [/node_modules/]
      }),
      babel({
        babelrc: false,
        exclude: [/node_modules/],
        presets: ['@babel/env']
      })
    ]
  };
  return _buildBundle(callback, rollupConfig, bundleName, locale, libVersion, translationResolver);
};

/**
 * The Gulp task for producing either variant of the legacy SDK bundle.
 *
 * @param {Function} callback
 * @param {Object<string, ?>} outputConfig Any variant-specific configuration
 *                                         for the legacy bundle.
 * @param {string} bundleName The name of the created bundle.
 * @param {string} locale The current locale
 * @param {string} libVersion The current JS library version
 * @param {TranslationResolver} translationResolver
 * @returns {stream.Writable} A {@link Writable} stream containing the legacy
 *                            SDK bundle.
 */
exports.legacyBundle = function (callback, outputConfig, bundleName, locale, libVersion, translationResolver) {
  const rollupConfig = {
    input: './src/answers-umd.js',
    output: outputConfig,
    plugins: [
      resolve({ browser: true }),
      commonjs({
        include: [/node_modules/]
      }),
      babel({
        runtimeHelpers: true,
        babelrc: false,
        exclude: /node_modules\/(?!cross-fetch)(?!@yext\/answers-storage)(?!@yext\/answers-core).*/,
        presets: [
          [
            '@babel/preset-env',
            {
              loose: true,
              modules: false
            }
          ]
        ],
        plugins: [
          '@babel/syntax-dynamic-import',
          ['@babel/plugin-transform-runtime', {
            corejs: 3
          }],
          '@babel/plugin-transform-arrow-functions',
          '@babel/plugin-proposal-object-rest-spread',
          '@babel/plugin-transform-object-assign'
        ]
      })
    ]
  };
  return _buildBundle(callback, rollupConfig, bundleName, locale, libVersion, translationResolver);
};

/**
 * Bundles the JS based on the given Rollup config.
 *
 * @param {Function} callback
 * @param {Object} rollupConfig config for the Rollup plugin used for JS module bundling
 * @param {string} bundleName The filename of the created bundle.
 * @param {string} locale The current locale
 * @param {string} libVersion The current JS library version
 * @param {TranslationResolver} translationResolver for the given locale
 * @returns {stream.Writable} A {@link Writable} stream containing the SDK bundle.
 */
function _buildBundle (callback, rollupConfig, bundleName, locale, libVersion, translationResolver) {
  return rollup(rollupConfig)
    .pipe(source(`${bundleName}.js`))
    .pipe(replace('@@LIB_VERSION', libVersion))
    .pipe(replace('@@LOCALE', locale))
    .pipe(replace(TRANSLATION_FLAGGER_REGEX, translateCall => {
      const placeholder = new TranslateCallParser().parse(translateCall);
      const translationResult = translationResolver.resolve(placeholder);
      const canBeTranslatedStatically = typeof translationResult === 'string' &&
        !placeholder.getPluralForm() &&
        placeholder.hasNoInterpolation();
      return canBeTranslatedStatically ? `"${translationResult}"` : translationResult;
    }))
    .pipe(dest('dist'))
    .on('end', callback);
}
