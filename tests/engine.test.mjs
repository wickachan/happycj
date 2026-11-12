import test from 'node:test';
import assert from 'node:assert/strict';
import { indexes, targetsFor, stats, makeSession, attempt, tick, readHistory, ROOTS } from '../src/engine.js';

test('Cangjie candidates preserve order and alternate codes without duplicates', () => {
  const {byCode, byChar} = indexes([['日','a'],['曰','a'],['日','a'],['日','aa']]);
  assert.deepEqual(byCode.get('a'), ['日','曰']);
  assert.deepEqual(byChar.get('日'), ['a','aa']);
  assert.equal(ROOTS.m, '一');
});
test('legacy fixed-width padding is trimmed without changing the source record', () => {
  const target = {answer_raw:'BT '};
  const s = makeSession('postfix', [target], 'Test');
  assert.equal(attempt(s, 'bt').accepted, true);
  assert.equal(s.complete, true);
  assert.equal(target.answer_raw, 'BT ');
  assert.equal(attempt(s, 'bt').ignored, true);
});
test('errors do not advance, recovery counts toward accuracy', () => {
  const s = makeSession('article', ['君','不'], 'Test');
  assert.equal(attempt(s,'日').accepted, false);
  assert.equal(s.position, 0);
  attempt(s,'君'); attempt(s,'不');
  assert.equal(s.errors,1);
  assert.deepEqual(stats(s.correct,s.attempts,60000),{accuracy:67,cpm:2,seconds:60});
});
test('article targets skip whitespace, preserve punctuation and supplementary characters', () => {
  assert.deepEqual(targetsFor('article',{text:'君\r\n不\t見 𠮷。'}),['君','不','見','𠮷','。']);
});
test('paused time never inflates active time', () => {
  const s = makeSession('article',['日'],'Test');
  tick(s,100); tick(s,1100);
  s.paused = true; tick(s,2000); tick(s,10000);
  s.paused = false; tick(s,11000); tick(s,12000);
  assert.equal(s.elapsedMs,2000);
  s.paused = true;
  assert.equal(attempt(s,'日').ignored,true);
});
test('corrupt or blocked local storage is recoverable', () => {
  assert.deepEqual(readHistory({getItem(){throw Error('blocked')}}), []);
  assert.deepEqual(readHistory({getItem(){return 'null'}}), []);
  assert.deepEqual(readHistory({getItem(){return '[{"id":"bad"}]'}}), []);
});
