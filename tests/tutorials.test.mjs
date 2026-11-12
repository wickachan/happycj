import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LESSONS, CODE_EXAMPLES, ROOT_GROUPS } from '../src/tutorials.js';
import { indexes } from '../src/engine.js';

const data = JSON.parse(readFileSync(new URL('../dist/data/cj.json', import.meta.url)));
test('every displayed full-character tutorial code is accepted by the article dictionary', () => {
  const {byChar} = indexes(data.dictionary);
  const examples = [...CODE_EXAMPLES, ...LESSONS.flatMap(lesson=>lesson.quiz.filter(q=>!['氵','扌','忄','亻'].includes(q.glyph)).map(q=>[q.glyph,q.answer]))];
  for (const [glyph,code] of examples) assert.ok(byChar.get(glyph)?.includes(code), `${glyph}: ${code}`);
});
test('the four original root families contain exactly 24 unique basic roots', () => {
  const keys = ROOT_GROUPS.flatMap(group=>[...group.keys]);
  assert.equal(keys.length,24);
  assert.equal(new Set(keys).size,24);
  assert.deepEqual([...keys].sort(), [...'abcdefghijklmnopqrstuvwy']);
  assert.deepEqual(LESSONS.map(lesson=>lesson.id), ['classification','shapes','rules','exceptions','fingers']);
});
