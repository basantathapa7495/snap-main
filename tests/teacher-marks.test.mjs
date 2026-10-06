import assert from "node:assert/strict";
import test from "node:test";
import {
  classKey,
  gradeFromScale,
  markStats,
  naturalRoll,
  parseMark,
} from "../lib/teacher-marks.ts";

test("normalizes class scope", () =>
  assert.equal(classKey("Grade 10", " A "), "10::a"));
test("sorts roll numbers naturally", () =>
  assert.ok(naturalRoll("2", "10") < 0));
test("rejects marks outside the exam maximum", () => {
  assert.equal(parseMark("-1", 50).error, "Use 0–50.");
  assert.equal(parseMark("51", 50).error, "Use 0–50.");
  assert.equal(parseMark("49.5", 50).value, 49.5);
});
test("uses configured grade rules and never invents one", () => {
  assert.equal(gradeFromScale(85, [{ min: 80, max: 89.99, grade: "A" }]), "A");
  assert.equal(gradeFromScale(85, []), "—");
});
test("calculates saved mark statistics", () => {
  assert.deepEqual(markStats([20, 40, 50], 50, 20), {
    average: 73.3,
    highest: 50,
    lowest: 20,
    passed: 3,
    failed: 0,
  });
});
