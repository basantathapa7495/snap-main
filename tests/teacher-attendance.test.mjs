import test from "node:test";
import assert from "node:assert/strict";
import { counts, markAllPresent, shiftDate, statusOf, trend } from "../lib/teacher-attendance.ts";

test("status normalization and summary include legacy late as present", () => {
  const rows = [{ student_id: "a", attendance_date: "2026-10-01", status: "late" }];
  assert.equal(statusOf(rows, "a", "2026-10-01"), "present");
  assert.deepEqual(counts(["present", "absent", "leave", "unmarked"]), { present: 1, absent: 1, leave: 1, total: 4, marked: 3 });
});

test("bulk present never overwrites protected leave", () => {
  assert.deepEqual(markAllPresent([{ status: "leave", approvedLeave: true }, { status: "absent", approvedLeave: false }]), [{ status: "leave", approvedLeave: true }, { status: "present", approvedLeave: false }]);
});

test("trend excludes dates with no actual attendance rows", () => {
  const result = trend([
    { student_id: "a", attendance_date: "2026-10-01", status: "present" },
    { student_id: "b", attendance_date: "2026-10-01", status: "absent" },
    { student_id: "a", attendance_date: "2026-10-03", status: "present" },
  ], new Set(["a", "b"]));
  assert.deepEqual(result.map((row) => row.date), ["2026-10-01", "2026-10-03"]);
  assert.deepEqual(result.map((row) => row.rate), [50, 100]);
});

test("date navigation is stable across month boundaries", () => {
  assert.equal(shiftDate("2026-10-01", -1), "2026-09-30");
});
