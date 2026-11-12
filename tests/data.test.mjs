import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {indexes, makeSession, attempt, targetsFor} from '../src/engine.js';
const data = JSON.parse(readFileSync(new URL('../dist/data/cj.json',import.meta.url)));

test('all 616 recovered answer fields complete their native exercise sessions',()=>{
  let total=0;
  for(const group of data.sets){
    assert.equal(group.records.length,group.count);
    const session=makeSession(group.source,group.records,group.source);
    for(const record of group.records){
      assert.match(record.answer_raw.trim(),/^[A-Y]{1,5}$/);
      assert.equal(record.bitmap_rows_u16_be_candidate.length,14);
      assert.equal(attempt(session,record.answer_raw.trim().toLowerCase()).accepted,true);
      total++;
    }
    assert.equal(session.complete,true);
  }
  assert.equal(total,616);
});
test('every character in all 21 articles is reachable through a Cangjie candidate',()=>{
  const {byCode,byChar}=indexes(data.dictionary);
  assert.equal(data.lessons.length,21);
  for(const lesson of data.lessons){
    const targets=targetsFor('article',lesson);
    assert.equal(targets.length,lesson.characters);
    const session=makeSession('article',targets,lesson.title);
    for(const char of targets){
      const codes=byChar.get(char);
      assert.ok(codes?.length,`Missing code for ${char}`);
      assert.ok(byCode.get(codes[0]).includes(char));
      assert.equal(attempt(session,char).accepted,true);
    }
    assert.equal(session.complete,true);
  }
});
