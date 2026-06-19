import { describe, expect, it, vi } from "vitest";
import { createHarnessController } from "./controller";
import type { DatabaseAdapter } from "./database";
import type { HarnessManifest } from "./manifest";

const manifest: HarnessManifest = {
  id: "workout-log",
  title: "운동 로그 기록",
  route: "/harness/workout-log",
  dependencies: {
    user: { id: "user-1", nickname: "테스트 유저" }
  },
  database: {
    resetMode: "truncate",
    tables: [
      {
        name: "workout_logs",
        label: "운동 기록",
        columns: ["id", "user_id", "exercise", "minutes", "created_at"]
      }
    ]
  }
};

describe("createHarnessController", () => {
  it("resets, seeds, and returns snapshots for allowlisted tables", async () => {
    const adapter: DatabaseAdapter = {
      resetTables: vi.fn(async () => undefined),
      seed: vi.fn(async () => undefined),
      snapshotTable: vi.fn(async () => ({
        table: "workout_logs",
        rowCount: 1,
        rows: [{ id: "log-1", exercise: "Squat" }]
      }))
    };

    const controller = createHarnessController({
      manifest,
      adapter,
      seedRows: {
        workout_logs: [{ id: "log-1", user_id: "user-1", exercise: "Squat", minutes: 20 }]
      }
    });

    await controller.resetAndSeed();
    const snapshot = await controller.snapshot();

    expect(adapter.resetTables).toHaveBeenCalledWith(["workout_logs"]);
    expect(adapter.seed).toHaveBeenCalledWith({
      workout_logs: [{ id: "log-1", user_id: "user-1", exercise: "Squat", minutes: 20 }]
    });
    expect(snapshot.tables.workout_logs.rowCount).toBe(1);
  });

  it("blocks snapshots for non-allowlisted tables", async () => {
    const adapter: DatabaseAdapter = {
      resetTables: vi.fn(),
      seed: vi.fn(),
      snapshotTable: vi.fn()
    };

    const controller = createHarnessController({ manifest, adapter, seedRows: {} });

    await expect(controller.snapshotTable("users")).rejects.toThrow(/not allowlisted/i);
  });
});
