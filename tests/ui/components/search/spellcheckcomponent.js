import DOM from '../../../../src/ui/dom/dom';
import mockManager from '../../../setup/managermocker';
import { mount } from 'enzyme';
import StorageKeys from '../../../../src/core/storage/storagekeys';
import SpellCheckComponent from '../../../../src/ui/components/search/spellcheckcomponent';

const COMPONENT_MANAGER = mockManager();

describe('spellcheck redirect links', () => {
  setupDOM();

  const component = createSpellcheckComponent();

  component.setState({
    correctedQuery: {
      value: 'What is Yext Answers?'
    },
    type: 'SUGGEST'
  });

  const wrapper = mount(component);
  const suggestionLinkWrapper = wrapper.find('.yxt-SpellCheck-container a');
  const suggestionLinkURL = new URL(suggestionLinkWrapper.getDOMNode().href);
  const linkUrlParams = new URLSearchParams(suggestionLinkURL.search);

  it('redirect links contain a query url param', () => {
    const query = linkUrlParams.get('query');
    expect(query).toEqual('What is Yext Answers?');
  });

  it('redirect links contain a skipSpellCheck url param', () => {
    const skipSpellCheck = linkUrlParams.get(StorageKeys.SKIP_SPELL_CHECK);
    expect(skipSpellCheck).toEqual('true');
  });

  it('redirect links contain a query trigger url param', () => {
    const queryTrigger = linkUrlParams.get(StorageKeys.QUERY_TRIGGER);
    expect(queryTrigger).toEqual('suggest');
  });
});

function setupDOM () {
  const bodyEl = DOM.query('body');
  DOM.empty(bodyEl);
  DOM.append(bodyEl, DOM.createEl('div', { id: 'spellcheck-component' }));
}

function createSpellcheckComponent () {
  const defaultConfig = {
    container: '#spellcheck-component',
    verticalKey: 'verticalKey'
  };
  return COMPONENT_MANAGER.create(SpellCheckComponent.type, defaultConfig);
}
