import FilterCombinators from '../../core/filters/filtercombinators';
import isEqual from 'lodash.isequal';
import Filter from '../../core/models/filter';

/**
 * Checks whether a filter is equal to or included somewhere within the persistedFilter.
 * Assumes the given filter is a simple filter, i.e. does not have any child filters.
 * The persistedFilter can be either combined or simple.
 *
 * @param {Filter} filter
 * @param {Filter} persistedFilter
 * @returns {boolean}
 */
export function filterIsPersisted (filter, persistedFilter) {
  const childFilters =
    persistedFilter[FilterCombinators.AND] || persistedFilter[FilterCombinators.OR];
  if (childFilters) {
    return !!childFilters.find(childFilter => filterIsPersisted(filter, Filter.from(childFilter)));
  }
  return isEqual(filter, persistedFilter);
}

/**
 * Given a filter, return an array of all it's descendants, including itself, that
 * filter on the given fieldId.
 *
 * @param {Filter} persistedFilter
 * @param {string} fieldId
 *
 * @returns {Array<Filter>}
 */
export function findSimpleFiltersWithFieldId (persistedFilter, fieldId) {
  const childFilters =
    persistedFilter[FilterCombinators.AND] || persistedFilter[FilterCombinators.OR];
  if (childFilters) {
    return childFilters.flatMap(
      childFilter => findSimpleFiltersWithFieldId(Filter.from(childFilter), fieldId));
  }
  if (Filter.from(persistedFilter).getFilterKey() === fieldId) {
    return [persistedFilter];
  }
  return [];
}

/**
 * Finds a persisted range filter for the given fieldId, and returns its contents.
 *
 * @param {Filter} persistedFilter
 * @param {string} fieldId
 * @returns {{minVal: number, maxVal: number}}
 */
export function getPersistedRangeFilterContents (persistedFilter, fieldId) {
  if (!persistedFilter || !persistedFilter.getFilterKey()) {
    return {};
  }
  const rangeFiltersForFieldId =
    findSimpleFiltersWithFieldId(persistedFilter, fieldId)
      .filter(f => f.isRangeFilter());
  if (rangeFiltersForFieldId.length < 1) {
    return {};
  }
  return rangeFiltersForFieldId[0][fieldId];
}
