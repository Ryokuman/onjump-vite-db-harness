import { parseHarnessManifest } from "../core/manifest";
import { resolveHarnessApiBaseUrl } from "./apiBaseUrl";

export const workoutLogManifest = parseHarnessManifest({
  id: "workout-log",
  title: "운동 로그 기록",
  route: "/harness/workout-log",
  dependencies: {
    user: {
      id: "mock-user-1",
      nickname: "목 유저"
    },
    apiBaseUrl: resolveHarnessApiBaseUrl()
  },
  database: {
    resetMode: "truncate",
    tables: [
      {
        name: "workout_logs",
        label: "운동 기록",
        columns: ["id", "user_id", "exercise", "minutes", "created_at"],
        orderBy: { column: "created_at", direction: "desc" }
      }
    ]
  }
});

export const workoutLogSeedRows = {
  workout_logs: [
    {
      id: "seed-log-1",
      user_id: "mock-user-1",
      exercise: "Push up",
      minutes: 10,
      created_at: "2026-06-19T00:00:00.000Z"
    }
  ]
};

export function getMockUser() {
  const user = workoutLogManifest.dependencies.user;

  if (!user || typeof user !== "object" || !("id" in user)) {
    throw new Error("Mock user dependency is missing an id.");
  }

  return user as { id: string; nickname: string };
}
