const { dest } = require('gulp');

const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const fs = require('fs');
const insert = require('rollup-plugin-insert');
const replace = require('gulp-replace');
const resolve = require('rollup-plugin-node-resolve');
const rollup = require('gulp-rollup-lightweight');
const source = require('vinyl-source-stream');

const TranslateCallParser = require('../../i18n/translatecallparser');
const TranslationResolver = require('../../i18n/translationresolver');

/**
 * The Gulp task for producing the modern version of the SDK bundle.
 *
 * @param {Function} callback
 * @param {Object<string, ?>} outputConfig Any variant-specific configuration
 *                                         for the modern bundle.
 * @param {string} bundleName The name of the created bundle.
 * @param {string} libVersion The current JS library version
 * @param {TranslationResolver} translationResolver
 *
 * @returns {stream.Writable} A {@link Writable} stream containing the modern
 *                            SDK bundle.
 */
exports.modernBundle = function (callback, outputConfig, bundleName, libVersion, translationResolver) {
  const rollupConfig = {
    input: './src/answers-umd.js',
    output: outputConfig,
    plugins: [
      resolve(),
      commonjs({
        include: './node_modules/**'
      }),
      babel({
        babelrc: false,
        exclude: 'node_modules/**',
        presets: ['@babel/env']
      })
    ]
  };
  return _buildBundle(callback, rollupConfig, bundleName, libVersion, translationResolver);
}

/**
 * The Gulp task for producing either variant of the legacy SDK bundle.
 *
 * @param {Function} callback
 * @param {Object<string, ?>} outputConfig Any variant-specific configuration
 *                                         for the legacy bundle.
 * @param {string} bundleName The name of the created bundle.
 * @param {string} libVersion The current JS library version
 * @param {TranslationResolver} translationResolver
 * @returns {stream.Writable} A {@link Writable} stream containing the legacy
 *                            SDK bundle.
 */
exports.legacyBundle = function (callback, outputConfig, bundleName, libVersion, translationResolver) {
  const rollupConfig = {
    input: './src/answers-umd.js',
    output: outputConfig,
    plugins: [
      resolve(),
      insert.prepend(
        fs.readFileSync('./conf/gulp-tasks/polyfill-prefix.js').toString(),
        {
          include: './src/answers-umd.js'
        }),
      commonjs({
        include: './node_modules/**'
      }),
      babel({
        runtimeHelpers: true,
        babelrc: false,
        exclude: 'node_modules/**',
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
          '@babel/plugin-proposal-object-rest-spread'
        ]
      })
    ]
  };
  return _buildBundle(callback, rollupConfig, bundleName, libVersion, translationResolver);
}

/**
 * Bundles the JS based on the given Rollup config.
 *
 * @param {Function} callback
 * @param {Object} rollupConfig config for the Rollup plugin used for JS module bundling
 * @param {string} bundleName The filename of the created bundle.
 * @param {string} libVersion The current JS library version
 * @param {TranslationResolver} translationResolver for the given locale
 * @returns {stream.Writable} A {@link Writable} stream containing the SDK bundle.
 */
function _buildBundle (callback, rollupConfig, bundleName, libVersion, translationResolver) {
  return rollup(rollupConfig)
    .pipe(source(`${bundleName}.js`))
    .pipe(replace('@@LIB_VERSION', libVersion))
    .pipe(replace(/replaceWithTranslation\([^;]+?\);/g, translateCall => {
      const placeholder = new TranslateCallParser().parse(translateCall);
      const translationResult = translationResolver.resolve(placeholder);
      const canBeTranslatedStatically = typeof translationResult === 'string'
        && !placeholder.getPluralForm()
        && placeholder.hasNoInterpolation();
      return canBeTranslatedStatically ? `"${translationResult}";` : translationResult;
     }))
    .pipe(dest('dist'))
    .on('end', callback);
}
