import SearchParams from '../../../src/ui/dom/searchparams';

/*
 * All tests are assuming window.URLSearchParams is undefined
 */
beforeEach(() => {
  global.URLSearchParams = null;
});

describe('searchparams parse', () => {
  it('parses standard url with no params', () => {
    const u = new SearchParams('https://www.yext.com/');
    expect(u.get('https://www.yext.com/')).toStrictEqual('');
    expect(u.get('askjfhsdkjhfs')).not.toStrictEqual('');
  });
  it('parses standard url', () => {
    const u = new SearchParams('https://www.yext.com/?query=hello');
    expect(u.get('query')).toStrictEqual('hello');
  });
  it('parses standard url with &', () => {
    const u = new SearchParams('https://www.yext.com/?query=hello&q=area51');
    expect(u.get('query')).toStrictEqual('hello');
    expect(u.get('q')).toStrictEqual('area51');
  });
  it('parses url starting with ?', () => {
    const u = new SearchParams('?query=hello');
    expect(u.get('query')).toStrictEqual('hello');
  });
  it('parses url starting with ? with &', () => {
    const u = new SearchParams('?query=hello&q=area51');
    expect(u.get('query')).toStrictEqual('hello');
    expect(u.get('q')).toStrictEqual('area51');
  });
  it('parses url without ?', () => {
    const u = new SearchParams('query=hello');
    expect(u.get('query')).toStrictEqual('hello');
  });
  it('parses url without ? with &', () => {
    const u = new SearchParams('query=hello&q=area51');
    expect(u.get('query')).toStrictEqual('hello');
    expect(u.get('q')).toStrictEqual('area51');
  });
  it('parses url with +', () => {
    const u = new SearchParams('query=hello+world&q=area51+event');
    expect(u.get('query')).toStrictEqual('hello world');
    expect(u.get('q')).toStrictEqual('area51 event');
  });
  it('parses query without value', () => {
    const u = new SearchParams('query=&q=area51+event');
    expect(u.get('query')).toStrictEqual('');
    expect(u.get('q')).toStrictEqual('area51 event');
  });
});

describe('searchparams get', () => {
  it('gets undefined', () => {
    const u = new SearchParams('query=hello+world&q=area51');
    expect(u.get(undefined)).toStrictEqual(null);
  });
  it('gets null', () => {
    const u = new SearchParams('query=hello+world&q=area51');
    expect(u.get(null)).toStrictEqual(null);
  });
  it('gets empty string', () => {
    const u = new SearchParams('query=hello+world&q=area51');
    expect(u.get('')).toStrictEqual(null);
  });
  it('gets empty', () => {
    const u = new SearchParams('query=hello+world&q=area51');
    expect(u.get()).toStrictEqual(null);
  });
});

describe('searchparams set', () => {
  it('sets undefined', () => {
    const u = new SearchParams('query=hello+world&q=area51');
    u.set(undefined, 'aliens');
    expect(u.get('undefined')).toStrictEqual('aliens');
  });
  it('sets null', () => {
    const u = new SearchParams('query=hello+world&q=area51');
    u.set(null, 'aliens');
    expect(u.get('null')).toStrictEqual('aliens');
  });
  it('sets empty string', () => {
    const u = new SearchParams('query=hello+world&q=area51');
    u.set('', 'aliens');
    expect(u.get('')).toStrictEqual('aliens');
  });
});

describe('searchparams encode', () => {
  it('toStrings correctly', () => {
    const u = new SearchParams('http://www.yext.com/?query=hello+world&q=area51');
    expect(u.toString()).toStrictEqual('query=hello+world&q=area51');
  });
  it('encodes !\'()%20', () => {
    let u = 'hello!friend';
    expect(SearchParams.encode(u)).toStrictEqual('hello%21friend');
    u = 'hello\'friend';
    expect(SearchParams.encode(u)).toStrictEqual('hello%27friend');
    u = 'hello(friend';
    expect(SearchParams.encode(u)).toStrictEqual('hello%28friend');
    u = 'hello)friend';
    expect(SearchParams.encode(u)).toStrictEqual('hello%29friend');
    u = 'hello friend';
    expect(SearchParams.encode(u)).toStrictEqual('hello+friend');
    u = 'hello%20friend'; // encodes %
    expect(SearchParams.encode(u)).toStrictEqual('hello%2520friend');
  });
});

describe('searchparams decode', () => {
  it('decodes %20', () => {
    let u = 'hello%20world';
    expect(SearchParams.decode(u)).toStrictEqual('hello world');
    u = 'hello+world';
    expect(SearchParams.decode(u)).toStrictEqual('hello world');
  });
});
