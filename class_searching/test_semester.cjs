const assert = require('node:assert/strict');
const { selectDefaultSemester } = require('./semester.js');
const terms = ['116-1', '114-2', '115-2', '114-1', '115-1'].map(id => ({id}));
for (const [day, expected] of [
  ['2026-09-06', '115-1'], ['2027-01-31', '115-1'],
  ['2027-02-01', '115-2'], ['2026-07-31', '114-2'], ['2026-08-01', '115-1'],
]) {
  assert.equal(selectDefaultSemester(terms, day).id, expected);
}
assert.equal(selectDefaultSemester(terms.filter(s => s.id !== '115-1'), '2026-09-06').id, '114-2');
assert.equal(selectDefaultSemester([{id:'116-1'}], '2026-09-06').id, '116-1');
console.log('Semester selection: 7 checks passed.');
