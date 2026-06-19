import { FormEvent, useEffect, useMemo, useState } from "react";
import { DbInspectorPanel } from "../ui/DbInspectorPanel";
import { workoutLogManifest } from "../demo/manifest";
import type { HarnessSnapshot } from "../core/controller";
import "./App.css";

const apiBaseUrl = workoutLogManifest.dependencies.apiBaseUrl as string;

export function App() {
  const [exercise, setExercise] = useState("Squat");
  const [minutes, setMinutes] = useState("20");
  const [snapshot, setSnapshot] = useState<HarnessSnapshot | null>(null);
  const [message, setMessage] = useState("");

  const latestRowId = useMemo(() => {
    const row = snapshot?.tables.workout_logs.rows[0];
    return typeof row?.id === "string" ? row.id : null;
  }, [snapshot]);

  async function refreshSnapshot() {
    const response = await fetch(`${apiBaseUrl}/__harness/snapshot`);
    setSnapshot(await response.json());
  }

  async function resetHarness() {
    const response = await fetch(`${apiBaseUrl}/__harness/reset`, { method: "POST" });
    setSnapshot(await response.json());
    setMessage("DB baseline restored");
  }

  async function createWorkoutLog(event: FormEvent) {
    event.preventDefault();
    const response = await fetch(`${apiBaseUrl}/api/workout-logs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ exercise, minutes })
    });

    if (!response.ok) {
      setMessage("저장 실패");
      return;
    }

    setMessage("운동 로그가 저장되었습니다");
    await refreshSnapshot();
  }

  async function deleteLatestWorkoutLog() {
    if (!latestRowId) return;
    await fetch(`${apiBaseUrl}/api/workout-logs/${encodeURIComponent(latestRowId)}`, {
      method: "DELETE"
    });
    setMessage("최근 운동 로그가 삭제되었습니다");
    await refreshSnapshot();
  }

  useEffect(() => {
    void refreshSnapshot();
  }, []);

  return (
    <main className="harness-shell">
      <section className="harness-workspace">
        <header>
          <p className="eyebrow">Vite page DB harness</p>
          <h1>{workoutLogManifest.title}</h1>
        </header>

        <form className="workout-card" onSubmit={createWorkoutLog}>
          <label>
            운동
            <input value={exercise} onChange={(event) => setExercise(event.target.value)} />
          </label>
          <label>
            시간
            <input
              inputMode="numeric"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
          </label>
          <div className="actions">
            <button type="submit">저장</button>
            <button type="button" onClick={deleteLatestWorkoutLog}>
              최근 기록 삭제
            </button>
            <button type="button" onClick={resetHarness}>
              DB 초기화
            </button>
          </div>
          <p role="status">{message}</p>
        </form>
      </section>

      <DbInspectorPanel
        tables={workoutLogManifest.database.tables}
        snapshots={snapshot?.tables ?? {}}
      />
    </main>
  );
}
