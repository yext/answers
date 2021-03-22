import DefaultPersistentStorage from '@yext/answers-storage';
import { AnswersStorageError } from '../errors/errors';
import SearchParams from '../../ui/dom/searchparams';

/** @typedef {import('./storagelistener').default} StorageListener */

/**
 * Storage is a container around application state.  It
 * exposes an interface for CRUD operations as well as listening
 * for stateful changes.
 *
 * @param {Function} callback for state (persistent store) updates
 * @param {Function} callback for state (persistent store) reset
 */
export default class Storage {
  constructor (config = {}) {
    /**
     * The listeners for changes in state (persistent storage changes)
     */
    this.persistedStateListeners = {
      update: config.updateListener || function () {},
      reset: config.resetListener || function () {}
    };

    /**
     * A hook for parsing values from persistent storage on init.
     *
     * @type {Function}
     */
    this.persistedValueParser = config.persistedValueParser;

    /**
     * The listener for window.pop in the persistent storage
     *
     * @param {Map<string, string>} queryParamsMap A Map containing the persisted state,
     *                                             for example a map of 'query' => 'virginia'
     * @param {string} queryParamsString the url params of the persisted state
     *                                   for the above case 'query=virginia'
     */
    this.popListener = (queryParamsMap, queryParamsString) => {
      this.persistedStateListeners.update(queryParamsMap, queryParamsString);
      this.persistedStateListeners.reset(queryParamsMap, queryParamsString);
    };

    /**
     * The core data for the storage
     *
     * @type {Map<string, *>}
     */
    this.storage = new Map();

    /**
     * The persistent storage implementation to store state
     * across browser sessions and URLs
     *
     * @type {DefaultPersistentStorage}
     */
    this.persistentStorage = new DefaultPersistentStorage(this.popListener);

    /**
     * The listeners to apply on changes to storage
     *
     * @type {StorageListener[]}
     */
    this.listeners = [];
  }

  /**
   * Decodes the initial state from the query params. This could be a
   * direct mapping from query param to storage keys in the storage or
   * could fetch a sessionId from some backend
   *
   * @param {string} url The starting URL
   * @returns {Storage}
   */
  init (url) {
    this.persistentStorage.init(url);
    this.persistentStorage.getAll().forEach((value, key) => {
      const parsedValue = this.persistedValueParser
        ? this.persistedValueParser(key, value)
        : value;
      this.set(key, parsedValue);
    });
    return this;
  }

  /**
   * Set the data in storage with the given key to the provided
   * data, completely overwriting any existing data.
   *
   * @param {string} key The storage key to set
   * @param {*} data The data to set
   */
  set (key, data) {
    if (key === undefined || key === null || typeof key !== 'string') {
      throw new AnswersStorageError('Storage key must be of type string', key, data);
    }

    if (typeof data === 'undefined') {
      throw new AnswersStorageError('Data cannot be of type undefined', key, data);
    }

    this.storage.set(key, data);
    this._callListeners('update', key);
  }

  /**
   * Updates the storage with a new entry of [key, data].  The entry
   * is not added to the URL until the history is updated.
   *
   * @param {string} key The storage key to set
   * @param {*} data The data to set
   */
  setWithPersist (key, data) {
    this.set(key, data);

    let serializedData = data;
    if (typeof data !== 'string') {
      serializedData = JSON.stringify(data);
    }

    this.persistentStorage.set(key, serializedData);
  }

  /**
   * Adds all entries of the persistent storage to the URL.
   */
  pushStateToHistory () {
    this.persistentStorage.pushStateToHistory();
    this.persistedStateListeners.update(
      this.persistentStorage.getAll(),
      this.getCurrentStateUrlMerged()
    );
  }

  /**
   * Get the current state for the provided key
   *
   * @param {string} key The storage key to get
   * @return {*} The state for the provided key, undefined if key doesn't exist
   */
  get (key) {
    return this.storage.get(key);
  }

  /**
   * Get the current state for all key/value pairs in storage
   *
   * @return {Map<string, *>} mapping from key to value representing the current state
   */
  getAll () {
    return new Map(this.storage);
  }

  /**
   * Remove the data in storage with the given key
   *
   * @param {string} key The storage key to delete
   */
  delete (key) {
    if (key === undefined || key === null || typeof key !== 'string') {
      throw new AnswersStorageError('Storage key must be of type string', key);
    }

    this.storage.delete(key);
    this.persistentStorage.delete(key);
  }

  /**
   * Whether the specified key exists or not
   *
   * @param {string} key the storage key
   * @return {boolean}
   */
  has (key) {
    return this.storage.has(key);
  }

  /**
   * Returns the url representing the current persisted state, merged
   * with any additional query params currently in the url.
   *
   * @returns {string}
   */
  getCurrentStateUrlMerged () {
    const searchParams = new SearchParams(window.location.search.substring(1));
    this.persistentStorage.getAll().forEach((value, key) => {
      searchParams.set(key, value);
    });
    return searchParams.toString();
  }

  /**
   * Returns the query parameters to encode the current state
   *
   * @return {string} The query parameters for a page link with the
   *                  current state encoded
   *                  e.g. query=all&context=%7Bkey:'hello'%7D
   */
  getUrlWithCurrentState () {
    return this.persistentStorage.getUrlWithCurrentState();
  }

  /**
   * Adds a listener to the given module for a given event
   *
   * @param {StorageListener} listener the listener to add
   */
  registerListener (listener) {
    if (!listener.eventType || !listener.storageKey ||
      !listener.callback || typeof listener.callback !== 'function') {
      throw new AnswersStorageError(`Invalid listener applied in storage: ${listener}`);
    }
    this.listeners.push(listener);
  }

  /**
   * Removes a given listener from the set of listeners
   *
   * @param {StorageListener} listener the listener to remove
   */
  removeListener (listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * @param {string} eventType
   * @param {string} storageKey
   */
  _callListeners (eventType, storageKey) {
    this.listeners.forEach((listener) => {
      if (listener.storageKey === storageKey && listener.eventType === eventType) {
        listener.callback(this.get(storageKey));
      }
    });
  }
}
