import { parseHarnessManifest } from "../core/manifest";
import { resolveHarnessApiBaseUrl } from "./apiBaseUrl";

export const foodLogManifest = parseHarnessManifest({
  id: "task-0036-food-log",
  title: "TASK-0036 식단 로그와 빠른 체크",
  route: "/harness/task-0036-food-log",
  dependencies: {
    user: {
      id: "task-0036-user",
      nickname: "TASK-0036 유저"
    },
    apiBaseUrl: resolveHarnessApiBaseUrl()
  },
  database: {
    resetMode: "truncate",
    tables: [
      {
        name: "users",
        label: "사용자",
        columns: ["id", "created_at"],
        orderBy: { column: "id", direction: "asc" }
      },
      {
        name: "auth_provider_identities",
        label: "인증 식별자",
        columns: ["provider", "provider_user_id", "user_id", "linked_at"],
        orderBy: { column: "provider", direction: "asc" }
      },
      {
        name: "goals",
        label: "목표",
        columns: ["id", "user_id", "goal_type", "status", "current_weight_kg", "target_weight_kg", "target_date", "tracking_strictness"],
        orderBy: { column: "id", direction: "asc" }
      },
      {
        name: "daily_checks",
        label: "일일 체크",
        columns: ["user_id", "date", "food_status", "workout_status", "weight_status", "completion_status", "analysis_quality"],
        orderBy: { column: "date", direction: "desc" }
      },
      {
        name: "food_logs",
        label: "식단 기록",
        columns: ["id", "user_id", "date", "name", "calories", "meal_type", "meal_time"],
        orderBy: { column: "id", direction: "desc" }
      }
    ]
  }
});

export const foodLogSeedRows = {
  users: [
    {
      id: "task-0036-user",
      created_at: "2026-06-23T00:00:00.000Z"
    }
  ],
  auth_provider_identities: [
    {
      provider: "task",
      provider_user_id: "task-0036-user@example.test",
      user_id: "task-0036-user",
      linked_at: "2026-06-23T00:00:00.000Z"
    },
    {
      provider: "dev",
      provider_user_id: "dev-user",
      user_id: "task-0036-user",
      linked_at: "2026-06-23T00:00:00.000Z"
    }
  ],
  goals: [
    {
      id: "task-0036-goal",
      user_id: "task-0036-user",
      goal_type: "fat_loss",
      status: "active",
      current_weight_kg: 72,
      target_weight_kg: 68,
      target_date: "2026-09-30",
      tracking_strictness: "standard"
    }
  ],
  daily_checks: [
    {
      user_id: "task-0036-user",
      date: "2026-06-23",
      food_status: "unset",
      workout_status: "unset",
      weight_status: "unset",
      completion_status: "incomplete",
      analysis_quality: "normal"
    }
  ],
  food_logs: []
};

export function getMockUser() {
  const user = foodLogManifest.dependencies.user;

  if (!user || typeof user !== "object" || !("id" in user)) {
    throw new Error("Mock user dependency is missing an id.");
  }

  return user as { id: string; nickname: string };
}
