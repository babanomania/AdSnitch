const test = require('node:test');
const assert = require('assert');
const { extractOwner } = require('../src/utils/domain');

test('extracts registrant name from RDAP data', () => {
  const sample = {
    entities: [
      {
        roles: ['registrant'],
        vcardArray: ['vcard', [['fn', {}, 'text', 'Example Corp']]]
      }
    ]
  };
  assert.strictEqual(extractOwner(sample), 'Example Corp');
});

test('returns Unknown for missing owner', () => {
  assert.strictEqual(extractOwner(null), 'Unknown');
});
