import { FormEvent, useEffect, useMemo, useState } from "react";
import { DbInspectorPanel } from "../ui/DbInspectorPanel";
import { foodLogManifest } from "../demo/manifest";
import type { HarnessSnapshot } from "../core/controller";
import "./App.css";

const apiBaseUrl = foodLogManifest.dependencies.apiBaseUrl as string;
const productApiBaseUrl = ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_ONJUMP_API_BASE_URL) ?? "http://localhost:4000";
const taskDate = "2026-06-23";

export function App() {
  const [name, setName] = useState("현미밥");
  const [calories, setCalories] = useState("420");
  const [mealTime, setMealTime] = useState("12:30");
  const [snapshot, setSnapshot] = useState<HarnessSnapshot | null>(null);
  const [message, setMessage] = useState("");

  const foodStatus = useMemo(() => {
    const row = snapshot?.tables.daily_checks?.rows[0];
    return typeof row?.food_status === "string" ? row.food_status : "unknown";
  }, [snapshot]);

  async function refreshSnapshot() {
    try {
      setSnapshot(await requestJson<HarnessSnapshot>(`${apiBaseUrl}/__harness/snapshot`));
    } catch {
      setMessage("DB snapshot 로드 실패");
    }
  }

  async function resetHarness() {
    try {
      setSnapshot(await requestJson<HarnessSnapshot>(`${apiBaseUrl}/__harness/reset`, { method: "POST" }));
      setMessage("DB baseline restored");
    } catch {
      setMessage("DB 초기화 실패");
    }
  }

  async function createFoodLog(event: FormEvent) {
    event.preventDefault();
    try {
      const session = await devLogin();
      await requestJson(`${productApiBaseUrl}/today/food`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ userId: session.user.id, date: taskDate, name, calories: Number(calories), mealType: "lunch", mealTime })
      });

      setMessage("식단 직접 입력이 저장되었습니다");
      await refreshSnapshot();
    } catch {
      setMessage("저장 실패");
    }
  }

  async function setFoodStatus(nextStatus: "logged" | "intentionally_skipped") {
    try {
      const session = await devLogin();
      await requestJson(`${productApiBaseUrl}/today/food/status`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ userId: session.user.id, date: taskDate, foodStatus: nextStatus })
      });
      setMessage(nextStatus === "logged" ? "식단 빠른 체크가 저장되었습니다" : "식단 미기록이 저장되었습니다");
      await refreshSnapshot();
    } catch {
      setMessage("식단 상태 저장 실패");
    }
  }

  async function checkValidationFailure() {
    try {
      const session = await devLogin();
      await requestJson(`${productApiBaseUrl}/today/food`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ userId: session.user.id, date: taskDate, name: "", calories: -10, mealType: "lunch", mealTime })
      });
      setMessage("validation 실패 입력이 저장되어 버렸습니다");
    } catch {
      setMessage("validation 실패 입력은 저장되지 않았습니다");
      await refreshSnapshot();
    }
  }

  useEffect(() => {
    void refreshSnapshot();
  }, []);

  return (
    <main className="harness-shell">
      <section className="harness-workspace">
        <header>
          <p className="eyebrow">Vite page DB harness</p>
          <h1>{foodLogManifest.title}</h1>
        </header>

        <form className="workout-card" onSubmit={createFoodLog}>
          <label>
            음식
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            kcal
            <input
              inputMode="numeric"
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
            />
          </label>
          <label>
            시간
            <input type="time" value={mealTime} onChange={(event) => setMealTime(event.target.value)} />
          </label>
          <div className="actions">
            <button type="submit">직접 입력 저장</button>
            <button type="button" onClick={() => setFoodStatus("logged")}>빠른 체크</button>
            <button type="button" onClick={() => setFoodStatus("intentionally_skipped")}>미기록</button>
            <button type="button" onClick={checkValidationFailure}>validation 실패 확인</button>
            <button type="button" onClick={resetHarness}>DB 초기화</button>
          </div>
          <strong>현재 food_status: {foodStatus}</strong>
          <p role="status">{message}</p>
        </form>
      </section>

      <DbInspectorPanel
        tables={foodLogManifest.database.tables}
        snapshots={snapshot?.tables ?? {}}
      />
    </main>
  );
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json();

  if (!response.ok) {
    throw new Error(typeof body?.error === "string" ? body.error : `Request failed with ${response.status}`);
  }

  return body as T;
}

async function devLogin(): Promise<{ user: { id: string }; token: string }> {
  return requestJson(`${productApiBaseUrl}/auth/dev-login`, { method: "POST" });
}
