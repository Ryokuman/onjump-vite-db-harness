import { describe, expect, it } from "vitest";
import { parseHarnessManifest } from "./manifest";

describe("parseHarnessManifest", () => {
  it("accepts a page manifest with allowlisted DB tables", () => {
    const manifest = parseHarnessManifest({
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
    });

    expect(manifest.database.tables[0].name).toBe("workout_logs");
    expect(manifest.dependencies.user).toMatchObject({ nickname: "테스트 유저" });
  });

  it("rejects manifests without DB table allowlists", () => {
    expect(() =>
      parseHarnessManifest({
        id: "unsafe",
        title: "Unsafe",
        route: "/unsafe",
        dependencies: {},
        database: {
          resetMode: "truncate",
          tables: []
        }
      })
    ).toThrow(/at least one table/i);
  });

  it("rejects columns reserved for harness snapshot metadata", () => {
    expect(() =>
      parseHarnessManifest({
        id: "unsafe",
        title: "Unsafe",
        route: "/unsafe",
        dependencies: {},
        database: {
          resetMode: "truncate",
          tables: [
            {
              name: "workout_logs",
              label: "운동 기록",
              columns: ["id", "__harness_row_count"]
            }
          ]
        }
      })
    ).toThrow(/reserved harness metadata/i);
  });
});
