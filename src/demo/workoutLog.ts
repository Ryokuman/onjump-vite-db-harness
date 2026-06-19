import { randomUUID } from "node:crypto";

export type WorkoutLogInput = {
  exercise: unknown;
  minutes: unknown;
};

export type NormalizedWorkoutLogInput = {
  exercise: string;
  minutes: number;
};

export type WorkoutLogInsert = {
  id: string;
  user_id: string;
  exercise: string;
  minutes: number;
  created_at: string;
};

export function normalizeWorkoutLogInput(input: WorkoutLogInput): NormalizedWorkoutLogInput {
  const exercise = String(input.exercise ?? "").trim();
  const minutes = Number(input.minutes);

  if (!exercise) {
    throw new Error("exercise is required");
  }

  if (!Number.isInteger(minutes) || minutes <= 0) {
    throw new Error("minutes must be a positive integer");
  }

  return { exercise, minutes };
}

export function buildWorkoutLogInsert(options: {
  id?: string;
  userId: string;
  input: NormalizedWorkoutLogInput;
}): WorkoutLogInsert {
  return {
    id: options.id ?? randomUUID(),
    user_id: options.userId,
    exercise: options.input.exercise,
    minutes: options.input.minutes,
    created_at: new Date().toISOString()
  };
}
