import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyRates } from '../lib/principal-attendance.ts';

const mark = (date, status = 'present') => ({attendance_date:date,status});

for (const kind of ['student','teacher']) {
  for (const days of [7,14,30]) {
    test(`${kind}: ${days}-day chart skips closed Saturday and keeps missing weekdays`, () => {
      const result = dailyRates([mark('2026-09-25'),mark('2026-09-27')], '2026-09-30', days, kind);
      assert.equal(result.points.some(p => p.date === '2026-09-26'),false);
      assert.equal(result.points.find(p => p.date === '2026-09-28').rate,null);
      const friday = result.points.findIndex(p => p.date === '2026-09-25');
      assert.equal(result.points[friday+1].date,'2026-09-27');
      assert.equal(result.average,100);
    });
  }
  test(`${kind}: holiday ranges are omitted, including recorded holiday dates`, () => {
    const result = dailyRates([mark('2026-09-27','absent'),mark('2026-09-29')], '2026-09-30', 7, kind,
      [{event_date:'2026-09-20',end_date:'2026-09-28'}]);
    assert.deepEqual(result.points.map(p => p.date),['2026-09-29','2026-09-30']);
    assert.equal(result.average,100);
    assert.equal(result.recordedDays,1);
  });
  test(`${kind}: a special working Saturday with marks remains visible`, () => {
    const result = dailyRates([mark('2026-09-26','absent')], '2026-09-30', 7, kind);
    assert.equal(result.points.find(p => p.date === '2026-09-26').rate,0);
  });
}
