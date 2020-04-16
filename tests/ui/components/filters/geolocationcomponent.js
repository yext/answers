import DOM from '../../../../src/ui/dom/dom';
import { mount } from 'enzyme';
import mockManager from '../../../setup/managermocker';
import GeoLocationComponent from '../../../../src/ui/components/filters/geolocationcomponent';
import AutoCompleteComponent from '../../../../src/ui/components/search/autocompletecomponent';

describe('GeoLocation filter component', () => {
  DOM.setup(document, new DOMParser());

  let COMPONENT_MANAGER, defaultConfig, setFilterNode;

  beforeEach(() => {
    const bodyEl = DOM.query('body');
    DOM.empty(bodyEl);
    DOM.append(bodyEl, DOM.createEl('div', { id: 'test-component' }));
    setFilterNode = jest.fn();

    const mockCore = {
      setFilterNode: setFilterNode
    };

    COMPONENT_MANAGER = mockManager(
      mockCore,
      GeoLocationComponent.defaultTemplateName(),
      AutoCompleteComponent.defaultTemplateName()
    );

    defaultConfig = {
      container: '#test-component'
    };
  });

  it('renders correctly with default config', () => {
    const component = COMPONENT_MANAGER.create('GeoLocationFilter', defaultConfig);
    const wrapper = mount(component);
    expect(wrapper.find('.yxt-GeoLocationFilter')).toHaveLength(1);
  });
});
