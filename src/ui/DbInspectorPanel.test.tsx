import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DbInspectorPanel } from "./DbInspectorPanel";

describe("DbInspectorPanel", () => {
  it("shows row count and recent rows for the selected table", () => {
    render(
      <DbInspectorPanel
        tables={[
          {
            name: "workout_logs",
            label: "운동 기록",
            columns: ["id", "exercise", "minutes"]
          }
        ]}
        snapshots={{
          workout_logs: {
            table: "workout_logs",
            rowCount: 1,
            rows: [{ id: "log-1", exercise: "Squat", minutes: 20 }]
          }
        }}
      />
    );

    expect(screen.getByText("운동 기록")).toBeInTheDocument();
    expect(screen.getByText("1 rows")).toBeInTheDocument();
    expect(screen.getByText("Squat")).toBeInTheDocument();
  });
});
