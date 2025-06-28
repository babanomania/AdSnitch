const test = require('node:test');
const assert = require('assert');
const { getDomainOwner } = require('../src/utils/domain');

test('returns known owner for t.co', () => {
  assert.strictEqual(getDomainOwner('t.co'), 'Twitter');
});

test('falls back to root domain', () => {
  assert.strictEqual(getDomainOwner('tracking.somesite.com'), 'SomeSite Inc.');
});
