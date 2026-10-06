export type GradeRule = Record<string, unknown>;

export const cleanGrade = (value?: string | null) =>
  (value || "")
    .trim()
    .replace(/^(class|grade)\s+/i, "")
    .toLowerCase();
export const cleanSection = (value?: string | null) =>
  (value || "").trim().toLowerCase();
export const classKey = (grade?: string | null, section?: string | null) =>
  `${cleanGrade(grade)}::${cleanSection(section)}`;
export const classTitle = (grade?: string | null, section?: string | null) => {
  const value = (grade || "").trim().replace(/^(class|grade)\s+/i, "");
  return `Grade ${value || "—"}${section?.trim() ? ` ${section.trim()}` : ""}`;
};

export function naturalRoll(a?: string | null, b?: string | null) {
  return (a || "").localeCompare(b || "", undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function gradeFromScale(percent: number | null, scale: GradeRule[]) {
  if (percent === null || !Number.isFinite(percent)) return "—";
  for (const rule of scale) {
    const min = Number(
      rule.min ?? rule.minimum ?? rule.from ?? rule.min_percentage,
    );
    const max = Number(
      rule.max ?? rule.maximum ?? rule.to ?? rule.max_percentage ?? 100,
    );
    const label = String(rule.grade ?? rule.label ?? rule.name ?? "").trim();
    if (label && Number.isFinite(min) && percent >= min && percent <= max)
      return label;
  }
  return "—";
}

export function parseMark(value: string, maximum: number) {
  if (!value.trim()) return { value: null, error: "" };
  const mark = Number(value);
  if (!Number.isFinite(mark))
    return { value: null, error: "Enter a valid number." };
  if (mark < 0 || mark > maximum)
    return { value: null, error: `Use 0–${maximum}.` };
  return { value: mark, error: "" };
}

export function markStats(values: number[], maximum: number, passMark: number) {
  if (!values.length)
    return { average: null, highest: null, lowest: null, passed: 0, failed: 0 };
  return {
    average:
      Math.round(
        (values.reduce((sum, value) => sum + value, 0) /
          values.length /
          maximum) *
          1000,
      ) / 10,
    highest: Math.max(...values),
    lowest: Math.min(...values),
    passed: values.filter((value) => value >= passMark).length,
    failed: values.filter((value) => value < passMark).length,
  };
}
