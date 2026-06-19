import { describe, expect, it } from "vitest";
import { buildWorkoutLogInsert, normalizeWorkoutLogInput } from "./workoutLog";

describe("workout log demo helpers", () => {
  it("normalizes workout input before it reaches the database", () => {
    expect(normalizeWorkoutLogInput({ exercise: "  Squat  ", minutes: "20" })).toEqual({
      exercise: "Squat",
      minutes: 20
    });
  });

  it("builds a safe insert payload for the mock user", () => {
    const payload = buildWorkoutLogInsert({
      id: "log-1",
      userId: "mock-user-1",
      input: { exercise: "Squat", minutes: 20 }
    });

    expect(payload).toMatchObject({
      id: "log-1",
      user_id: "mock-user-1",
      exercise: "Squat",
      minutes: 20
    });
    expect(payload.created_at).toBeTypeOf("string");
  });
});
