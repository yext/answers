import PersistentStorage from '../../../src/ui/storage/persistentstorage';

describe('adding and removing data', () => {
  let storage;
  let mockPushState;
  let updateCb;

  beforeEach(() => {
    updateCb = jest.fn();
    storage = new PersistentStorage({ updateListener: updateCb });
    mockPushState = jest.fn();
    window.history.pushState = mockPushState;
    window.location.search = '';
  });

  it('pushes history after set', () => {
    storage.set('key1', 'val1');
    expect.assertions(1);
    return new Promise(resolve => setTimeout(() => {
      expect(mockPushState).toBeCalledWith(null, null, '?key1=val1');
      resolve();
    }, 200));
  });

  it('jsonifies objects', () => {
    const obj = { 'key': 'val' };
    storage.set('key1', obj);
    expect.assertions(1);
    return new Promise(resolve => setTimeout(() => {
      expect(mockPushState).toBeCalledWith(null, null, `?key1=${encodeURIComponent(JSON.stringify(obj))}`);
      resolve();
    }, 200));
  });

  it('batches updates', () => {
    storage.set('key1', 'val1');
    storage.set('key2', 'val2');
    storage.set('key3', 'val3');

    expect.assertions(2);
    return new Promise(resolve => setTimeout(() => {
      expect(mockPushState).toBeCalledTimes(1);
      expect(mockPushState).toBeCalledWith(null, null, '?key1=val1&key2=val2&key3=val3');
      resolve();
    }, 200));
  });

  it('removes data with delete()', () => {
    storage.set('key1', 'val1');
    storage.delete('key1');

    expect.assertions(1);
    return new Promise(resolve => setTimeout(() => {
      expect(mockPushState).toBeCalledWith(null, null, '?');
      resolve();
    }, 200));
  });

  it('sends update info to listeners', () => {
    storage.set('key1', 'val1');
    expect.assertions(1);
    return new Promise(resolve => setTimeout(() => {
      expect(updateCb).toBeCalledWith({ key1: 'val1' }, 'key1=val1');
      resolve();
    }, 200));
  });
});
