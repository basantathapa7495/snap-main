import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAllRows } from '../lib/load-all-rows.ts';

test('results above the response cap retain every row in order', async () => {
  const source = Array.from({length:3024}, (_,id) => ({id}));
  const offsets = [];
  const result = await loadAllRows(offset => {
    offsets.push(offset);
    return Promise.resolve({data:source.slice(offset,offset+1000),error:null});
  });
  assert.deepEqual(result.data,source);
  assert.deepEqual(offsets,[0,1000,2000,3000]);
});

test('a failed later page never returns a silently incomplete result', async () => {
  await assert.rejects(loadAllRows(offset => Promise.resolve(offset === 0
    ? {data:Array.from({length:1000},(_,id)=>({id})),error:null}
    : {data:null,error:{message:'Read denied'}})), /Read denied/);
});
