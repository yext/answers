import SpellCheck from '../../../src/core/models/spellcheck';

it('constructs a spellcheck from an answers-core spellcheck', () => {
  const coreSpellCheck = {
    originalQuery: 'where is the baank',
    correctedQuery: 'where is the bank',
    type: 'AUTOCORRECT'
  };

  const expectedSpellCheck = {
    query: 'where is the baank',
    correctedQuery: {
      value: 'where is the bank'
    },
    type: 'AUTOCORRECT',
    shouldShow: true
  };

  const actualSpellCheck = SpellCheck.fromCore(coreSpellCheck);

  expect(actualSpellCheck).toMatchObject(expectedSpellCheck);
});
