import SearchParams from '../../../src/ui/dom/searchparams';
import { PRODUCTION, SANDBOX } from '../../../src/core/constants';
import {
  getLiveApiUrl,
  getCachedLiveApiUrl,
  getKnowledgeApiUrl,
  getAnalyticsUrl,
  addParamsToUrl,
  urlWithoutQueryParamsAndHash,
  equivalentParams
} from '../../../src/core/utils/urlutils';

describe('getUrlFunctions work', () => {
  it('differentiates sandbox from prod', () => {
    expect(getLiveApiUrl()).not.toEqual(expect.stringContaining('sandbox'));
    expect(getCachedLiveApiUrl()).not.toEqual(expect.stringContaining('sandbox'));
    expect(getKnowledgeApiUrl()).not.toEqual(expect.stringContaining('sandbox'));
    expect(getAnalyticsUrl()).not.toEqual(expect.stringContaining('sandbox'));

    expect(getLiveApiUrl(SANDBOX)).toEqual(expect.stringContaining('sandbox'));
    expect(getCachedLiveApiUrl(SANDBOX)).toEqual(expect.stringContaining('sandbox'));
    expect(getKnowledgeApiUrl(SANDBOX)).toEqual(expect.stringContaining('sandbox'));
    expect(getAnalyticsUrl(SANDBOX)).toEqual(expect.stringContaining('sandbox'));
  });

  it('differentiates conversion tracking in analytics url', () => {
    expect(getAnalyticsUrl(PRODUCTION, true)).toEqual(expect.stringContaining('realtimeanalytics'));
    expect(getAnalyticsUrl(SANDBOX, true)).toEqual(expect.stringContaining('realtimeanalytics'));

    expect(getAnalyticsUrl(PRODUCTION)).not.toEqual(expect.stringContaining('realtimeanalytics'));
    expect(getAnalyticsUrl(SANDBOX)).not.toEqual(expect.stringContaining('realtimeanalytics'));
  });
});

describe('addParamsToUrl works', () => {
  it('adds params when currentParams is undefined', () => {
    expect(addParamsToUrl('https://yext.com/', { referrerPageUrl: '' }))
      .toEqual('https://yext.com/?referrerPageUrl=');
  });

  it('adds params when params already exist', () => {
    expect(addParamsToUrl(
      'https://yext.com/',
      { query: 'all', referrerPageUrl: '' },
      new SearchParams('?page=10&facets=true')
    )).toEqual('https://yext.com/?page=10&facets=true&query=all&referrerPageUrl=');

    expect(addParamsToUrl(
      'https://yext.com/?query=hello&page=5',
      { query: 'all', referrerPageUrl: '' },
      new SearchParams('?page=10&facets=true')
    )).toEqual('https://yext.com/?page=10&facets=true&query=all&referrerPageUrl=');
  });

  it('adds params when new params are empty', () => {
    expect(addParamsToUrl(
      'https://yext.com/',
      {},
      new SearchParams('?page=10&facets=true')
    )).toEqual('https://yext.com/?page=10&facets=true');
  });

  it('encodes new params correctly', () => {
    expect(addParamsToUrl(
      'https://yext.com/',
      { query: 'all', referrerPageUrl: 'https://www.yext.com/' },
      new SearchParams('?page=10&facets=true')
    )).toEqual('https://yext.com/?page=10&facets=true&query=all&referrerPageUrl=https%3A%2F%2Fwww.yext.com%2F');
  });
});

describe('urlWithoutQueryParamsAndHash works', () => {
  it('removes query params and hashes', () => {
    expect(urlWithoutQueryParamsAndHash('https://yext.com/?query=hello&referrerPageUrl=#Footer'))
      .toEqual('https://yext.com/');
  });

  it('handles urls without params and hashes', () => {
    expect(urlWithoutQueryParamsAndHash('https://yext.com/')).toEqual('https://yext.com/');
  });
});

describe('equivalentParams works', () => {
  const params1 = new SearchParams('?query=hello');
  it('checks when one or both params is an empty SearchParams', () => {
    expect(equivalentParams(params1, new SearchParams())).toEqual(false);
    expect(equivalentParams(new SearchParams(), params1)).toEqual(false);
    expect(equivalentParams(new SearchParams(), new SearchParams())).toEqual(true);
  });

  it('checks when they have different # of params', () => {
    const params2 = new SearchParams('?query=hello&referrerPageUrl=');
    expect(equivalentParams(params1, params2)).toEqual(false);
    expect(equivalentParams(params2, params1)).toEqual(false);
  });

  it('checks when they have different param values', () => {
    const params2 = new SearchParams('?query=hello&referrerPageUrl=');
    const params3 = new SearchParams('?query=hello&referrerPageUrl=');
    params3.set('referrerPageUrl', 'https%3A%2F%2Fwww.yext.com%2F');
    expect(equivalentParams(params2, params3)).toEqual(false);
    expect(equivalentParams(params3, params2)).toEqual(false);
  });

  it('checks when they are the exact same', () => {
    const params2 = new SearchParams('query=all&referrerPageUrl=&Facets.filterbox.filter0=%5B%5D&Facets.filterbox.filter1=%5B%5D&Facets.filterbox.filter2=%5B%5D&Facets.filterbox.filter3=%5B%5D&Facets.filterbox.filter4=%5B%5D&Facets.filterbox.filter5=%5B%5D&Facets.filterbox.filter6=%5B%5D&Facets.filterbox.filter7=%5B%5D&Facets.filterbox.filter8=%5B%5D&Facets.filterbox.filter9=%5B%5D&Facets.filterbox.filter10=%5B%5D&context=%7B"state"%3A"hx"%7D&tabOrder=index.html%2CKM%2Cevents%2Cfaq%2Cjob%2Clinks%2Cpeople%2Crestaurant');
    const params3 = new SearchParams('query=all&referrerPageUrl=&Facets.filterbox.filter0=%5B%5D&Facets.filterbox.filter1=%5B%5D&Facets.filterbox.filter2=%5B%5D&Facets.filterbox.filter3=%5B%5D&Facets.filterbox.filter4=%5B%5D&Facets.filterbox.filter5=%5B%5D&Facets.filterbox.filter6=%5B%5D&Facets.filterbox.filter7=%5B%5D&Facets.filterbox.filter8=%5B%5D&Facets.filterbox.filter9=%5B%5D&Facets.filterbox.filter10=%5B%5D&context=%7B"state"%3A"hx"%7D&tabOrder=index.html%2CKM%2Cevents%2Cfaq%2Cjob%2Clinks%2Cpeople%2Crestaurant');
    expect(equivalentParams(params2, params3)).toEqual(true);
    expect(equivalentParams(params3, params2)).toEqual(true);
  });
});
