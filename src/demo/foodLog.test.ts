import { describe, expect, it } from "vitest";
import { normalizeFoodLogInput } from "./foodLog";

describe("food log demo helpers", () => {
  it("normalizes food input before it reaches the product API", () => {
    expect(normalizeFoodLogInput({ name: "  현미밥  ", calories: "420", mealType: "lunch", mealTime: "12:30" })).toEqual({
      name: "현미밥",
      calories: 420,
      mealType: "lunch",
      mealTime: "12:30"
    });
  });

  it("rejects the TASK-0036 validation failure input", () => {
    expect(() => normalizeFoodLogInput({ name: "", calories: -10, mealType: "lunch", mealTime: "12:30" })).toThrow("name is required");
  });
});
