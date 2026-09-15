import test from 'node:test';
import assert from 'node:assert/strict';
import { roomId, validateVector, magnitude } from '../src/model.js';
const vector = () => ({ label: 'F', color: '#57dfc2', origin: {x:0,y:0,z:0}, components: {x:3,y:4,z:0} });
test('room normalization and path rejection', () => {
  assert.equal(roomId(' abcd '), 'ABCD');
  for (const bad of ['a', '../ABCD', 'AB/CD', 'A'.repeat(13), '<svg>']) assert.throws(() => roomId(bad));
});
test('physical magnitude and zero vector', () => {
  assert.equal(magnitude(validateVector(vector())), 5);
  const v = vector(); v.components = {x:0,y:0,z:0}; assert.equal(magnitude(validateVector(v)), 0);
});
test('reject malformed and unbounded numeric data', () => {
  for (const value of [NaN, Infinity, -Infinity, 101, -101, '3']) {
    const v = vector(); v.origin.x = value; assert.throws(() => validateVector(v));
  }
  const v = vector(); v.color = 'red'; assert.throws(() => validateVector(v));
});
