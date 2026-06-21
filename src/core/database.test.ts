import { describe, expect, it } from "vitest";
import { buildSnapshotQuery } from "./database";

describe("buildSnapshotQuery", () => {
  it("orders snapshots by the manifest recency column when provided", () => {
    const query = buildSnapshotQuery({
      name: "workout_logs",
      label: "운동 기록",
      columns: ["id", "exercise", "created_at"],
      orderBy: { column: "created_at", direction: "desc" }
    });

    expect(query).toContain('ORDER BY "created_at" DESC');
  });

  it("reads row count and limited rows from one statement", () => {
    const query = buildSnapshotQuery({
      name: "workout_logs",
      label: "운동 기록",
      columns: ["id", "exercise", "created_at"],
      orderBy: { column: "created_at", direction: "desc" }
    });

    expect(query).toContain('"__harness_row_count"');
    expect(query).toContain('"__harness_rows"');
    expect(query).toContain("jsonb_agg");
  });
});
