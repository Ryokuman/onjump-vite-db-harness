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

  it("reads row count and limited rows from one statement without JSON coercion", () => {
    const query = buildSnapshotQuery({
      name: "workout_logs",
      label: "운동 기록",
      columns: ["id", "exercise", "created_at"],
      orderBy: { column: "created_at", direction: "desc" }
    });

    expect(query).toContain('"__harness_row_count"');
    expect(query).toContain('"__harness_has_row"');
    expect(query).not.toContain("jsonb_agg");
    expect(query).not.toContain("to_jsonb");
  });

  it("preserves the manifest ordering in the final result set", () => {
    const query = buildSnapshotQuery({
      name: "workout_logs",
      label: "운동 기록",
      columns: ["id", "exercise", "created_at"],
      orderBy: { column: "created_at", direction: "desc" }
    });

    expect(query).toContain('"__harness_order"');
    expect(query).toContain('ORDER BY "__harness_order" ASC');
  });
});
