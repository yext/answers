import AppliedQueryFilter from '../../../src/core/models/appliedqueryfilter';

it('constructs an applied query filter from an answers-core applied query filter', () => {
  const coreFilter = {
    displayKey: 'key1',
    displayValue: '23',
    filter: {
      fieldId: 'field1',
      matcher: '$eq',
      value: 'yext'
    }
  };
  const expectedFilter = {
    key: 'key1',
    value: '23',
    filter: {
      field1: {
        $eq: 'yext'
      }
    },
    fieldId: 'field1'
  };
  const actualFilter = AppliedQueryFilter.fromCore(coreFilter);

  expect(actualFilter).toMatchObject(expectedFilter);
});
