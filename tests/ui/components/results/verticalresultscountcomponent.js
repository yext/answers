import DOM from '../../../../src/ui/dom/dom';
import { mount } from 'enzyme';
import mockManager from '../../../setup/managermocker';
import VerticalResultsCountComponent from '../../../../src/ui/components/results/verticalresultscountcomponent';
import StorageKeys from '../../../../src/core/storage/storagekeys';
import SearchStates from '../../../../src/core/storage/searchstates';

DOM.setup(document, new DOMParser());

describe('results count component', () => {
  let defaultConfig;

  beforeEach(() => {
    const bodyEl = DOM.query('body');
    DOM.empty(bodyEl);
    DOM.append(bodyEl, DOM.createEl('div', { id: 'test-component' }));

    defaultConfig = {
      container: '#test-component',
      verticalKey: 'verticalKey'
    };
  });

  it('does not render before a search is made', () => {
    const COMPONENT_MANAGER = mockManager();
    const component = COMPONENT_MANAGER.create(VerticalResultsCountComponent.type, defaultConfig);
    const wrapper = mount(component);
    expect(wrapper.exists('.yxt-VerticalResultsCount')).toBeFalsy();
  });

  it('renders the current results count', () => {
    const COMPONENT_MANAGER = mockManager();
    const component = COMPONENT_MANAGER.create(VerticalResultsCountComponent.type, defaultConfig);
    component.setState({
      results: new Array(20),
      resultsCount: 100
    });
    const wrapper = mount(component);
    expect(wrapper.find('.yxt-VerticalResultsCount-start').text()).toEqual('1');
    expect(wrapper.find('.yxt-VerticalResultsCount-end').text()).toEqual('20');
    expect(wrapper.find('.yxt-VerticalResultsCount-total').text()).toEqual('100');
  });

  it('works with search offset', () => {
    const COMPONENT_MANAGER = mockManager();
    COMPONENT_MANAGER.core.storage.set(StorageKeys.SEARCH_OFFSET, 40);
    const component = COMPONENT_MANAGER.create(VerticalResultsCountComponent.type, defaultConfig);
    component.setState({
      results: new Array(10),
      resultsCount: 200
    });
    const wrapper = mount(component);
    expect(wrapper.find('.yxt-VerticalResultsCount-start').text()).toEqual('41');
    expect(wrapper.find('.yxt-VerticalResultsCount-end').text()).toEqual('50');
    expect(wrapper.find('.yxt-VerticalResultsCount-total').text()).toEqual('200');
  });

  it('page start is equal to the storage search offset plus one', () => {
    const COMPONENT_MANAGER = mockManager();
    COMPONENT_MANAGER.core.storage.set(StorageKeys.SEARCH_OFFSET, 15);
    const component = COMPONENT_MANAGER.create(VerticalResultsCountComponent.type, defaultConfig);
    expect(component.getState('pageStart')).toEqual(16);
  });

  it('page end is equal to the storage search offset plus the number of results', () => {
    const COMPONENT_MANAGER = mockManager();
    COMPONENT_MANAGER.core.storage.set(StorageKeys.SEARCH_OFFSET, 15);
    const component = COMPONENT_MANAGER.create(VerticalResultsCountComponent.type, defaultConfig);
    component.setState({
      resultsCount: 3,
      results: ['result1', 'result2', 'result3']
    });
    expect(component.getState('pageEnd')).toEqual(18);
  });

  it('listens to updates to VERTICAL_RESULTS in storage', () => {
    const COMPONENT_MANAGER = mockManager();
    const storage = COMPONENT_MANAGER.core.storage;
    const component = COMPONENT_MANAGER.create(VerticalResultsCountComponent.type, defaultConfig);
    const wrapper = mount(component);
    expect(wrapper.exists('.yxt-VerticalResultsCount')).toBeFalsy();
    storage.set(StorageKeys.VERTICAL_RESULTS, {
      searchState: SearchStates.SEARCH_COMPLETE,
      resultsCount: 3,
      results: ['a', 'b', 'cOoOoOkie']
    });
    wrapper.update();
    expect(wrapper.exists('.yxt-VerticalResultsCount')).toBeTruthy();
  });
});
