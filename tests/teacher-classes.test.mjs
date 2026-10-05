import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSchedule,
  matchesStudent,
  nepalClock,
  nextSlot,
  slotStatus,
  timeLabel,
} from "../lib/teacher-classes.ts";

const cls = {
  id: "class-a",
  school_id: "school",
  class_name: "Class 10",
  class: null,
  name: null,
  class_number: null,
  section_name: "A",
  section: "A",
  academic_year: 2083,
  archived_at: null,
};
const assignment = {
  id: "assignment",
  class_id: cls.id,
  class_name: "Class 10",
  subject: "Mathematics",
  period_id: "period",
  weekday: null,
  periods_per_week: 6,
  academic_year: "2083",
};
const period = {
  id: "period",
  name: "Period 1",
  kind: "lesson",
  position: 1,
  start_time: "08:00:00",
  end_time: "08:45:00",
  academic_year: 2083,
};

test("student enrollment matches normalized grade and exact section", () => {
  const student = {
    id: "student",
    name: "Student",
    class: " Grade 10 ",
    section: " a ",
    roll_no: "1",
  };
  assert.equal(matchesStudent(student, cls), true);
  assert.equal(matchesStudent({ ...student, section: "B" }, cls), false);
  assert.equal(matchesStudent({ ...student, class: "Class 11" }, cls), false);
  assert.equal(
    matchesStudent(student, { ...cls, section: null, section_name: null }),
    false,
  );
});
test("Nepal clock changes the date at local midnight independently of server timezone", () => {
  assert.deepEqual(nepalClock(new Date("2026-10-05T18:20:00Z")), {
    date: "2026-10-06",
    weekday: 2,
    minutes: 5,
  });
});
test("recurring slots expand Sunday to Friday without Saturday or break periods", () => {
  const schedule = buildSchedule([cls], [assignment], [period], []);
  assert.deepEqual(
    schedule.map((s) => s.weekday),
    [0, 1, 2, 3, 4, 5],
  );
  assert.equal(
    buildSchedule([cls], [assignment], [{ ...period, kind: "break" }], [])
      .length,
    0,
  );
  assert.equal(
    buildSchedule([cls], [assignment], [{ ...period, academic_year: 2082 }], [])
      .length,
    0,
  );
  assert.equal(
    buildSchedule([cls], [{ ...assignment, weekday: 2 }], [period], []).length,
    1,
  );
});
test("period status uses exact start/end boundaries and never fabricates missing times", () => {
  const slot = buildSchedule([cls], [assignment], [period], [])[0];
  const clock = { date: "2026-10-04", weekday: 0, minutes: 479 };
  assert.equal(slotStatus(slot, clock), "Upcoming");
  assert.equal(slotStatus(slot, { ...clock, minutes: 480 }), "Now");
  assert.equal(slotStatus(slot, { ...clock, minutes: 525 }), "Completed");
  assert.equal(slotStatus({ ...slot, end: null }, clock), "Time not set");
  assert.equal(timeLabel("13:05:00"), "1:05 PM");
});
test("next class wraps across Saturday and the week boundary", () => {
  const schedule = buildSchedule([cls], [assignment], [period], []);
  assert.equal(
    nextSlot(schedule, { date: "2026-10-09", weekday: 5, minutes: 900 }).days,
    2,
  );
  assert.equal(
    nextSlot(schedule, { date: "2026-10-10", weekday: 6, minutes: 900 }).slot
      .weekday,
    0,
  );
  assert.equal(
    nextSlot([], { date: "2026-10-10", weekday: 6, minutes: 900 }),
    null,
  );
});
test("legacy schedules require an assigned subject and unambiguous section and do not duplicate period assignments", () => {
  const legacy = {
    id: "legacy",
    class_name: "Grade 10 A",
    subject: "Mathematics",
    weekday: 1,
    start_time: "08:00",
    end_time: "08:45",
    room: "Room 10",
  };
  assert.equal(
    buildSchedule([cls], [{ ...assignment, period_id: null }], [], [legacy])
      .length,
    1,
  );
  assert.equal(
    buildSchedule([cls], [assignment], [period], [legacy]).length,
    6,
  );
  assert.equal(
    buildSchedule(
      [cls],
      [assignment],
      [],
      [{ ...legacy, class_name: "Grade 10" }],
    ).length,
    0,
  );
  assert.equal(
    buildSchedule([cls], [assignment], [], [{ ...legacy, subject: "Science" }])
      .length,
    0,
  );
});
