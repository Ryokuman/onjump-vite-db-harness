import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

const snapshotResponse = {
  manifestId: "task-0036-food-log",
  tables: {
    daily_checks: {
      table: "daily_checks",
      rowCount: 1,
      rows: [{ user_id: "task-0036-user", date: "2026-06-23", food_status: "unset" }]
    },
    food_logs: {
      table: "food_logs",
      rowCount: 0,
      rows: []
    }
  }
};

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a reset failure instead of replacing the snapshot with an error payload", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(snapshotResponse))
      .mockResolvedValueOnce(jsonResponse({ error: "untrusted origin" }, { ok: false, status: 403 }));

    render(<App />);

    await screen.findByText("현재 food_status: unset");
    fireEvent.click(screen.getByRole("button", { name: "DB 초기화" }));

    expect(await screen.findByText("DB 초기화 실패")).toBeInTheDocument();
    expect(screen.getByText("현재 food_status: unset")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows a quick check failure when the backend rejects the mutation", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(snapshotResponse))
      .mockResolvedValueOnce(jsonResponse({ user: { id: "task-0036-user" }, token: "token" }))
      .mockResolvedValueOnce(jsonResponse({ error: "not ready" }, { ok: false, status: 500 }));

    render(<App />);

    await screen.findByText("현재 food_status: unset");
    fireEvent.click(screen.getByRole("button", { name: "빠른 체크" }));

    expect(await screen.findByText("식단 상태 저장 실패")).toBeInTheDocument();
    expect(screen.getByText("현재 food_status: unset")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("shows a save failure when the food log request cannot reach the backend", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(snapshotResponse))
      .mockResolvedValueOnce(jsonResponse({ user: { id: "task-0036-user" }, token: "token" }))
      .mockRejectedValueOnce(new TypeError("network down"));

    render(<App />);

    await screen.findByText("현재 food_status: unset");
    fireEvent.click(screen.getByRole("button", { name: "직접 입력 저장" }));

    expect(await screen.findByText("저장 실패")).toBeInTheDocument();
    expect(screen.getByText("현재 food_status: unset")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body
  } as Response;
}
