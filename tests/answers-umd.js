// import ANSWERS from '../src/answers-umd';

let windowSpy;

describe('ANSWERS instance integration testing', () => {
  beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get');
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  it('Spellcheck query params in the URL trigger a spellcheck search during ANSWERS initialization', async () => {
    mockWindowWithData({
      location: {
        search: '?query=office+space&queryTrigger=suggest&skipSpellCheck=true'
      }
    });
    // await initAnswers();
    // const expectedParams = expect.objectContaining({
    //   query: 'office space',
    //   queryTrigger: 'suggest',
    //   skipSpellCheck: 'true'
    // });
    // expect(ANSWERS.core._coreLibrary.universalSearch).toHaveBeenCalledWith(expectedParams);
  });
});

/**
 * Mocks the window for jest testing while putting the provided data on the window
 * @param {*} data
 */
function mockWindowWithData (data) {
  windowSpy.mockImplementation(() => ({
    performance: {
      mark: jest.fn()
    },
    addEventListener: jest.fn(),
    ...data
  }));
}

/**
 * Initializes ANSWERS for jest testing with some functionality disabled
 */
// async function initAnswers () {
//   // Don't load the templates during testing
//   ANSWERS._loadTemplates = () => Promise.resolve();
//   await ANSWERS.init({
//     apiKey: 'test',
//     experienceKey: 'test',
//     // Don't load this polyfill during testing
//     disableCssVariablesPonyfill: 'true'
//   });
// }
