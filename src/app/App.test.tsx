import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

const snapshotResponse = {
  manifestId: "workout-log",
  tables: {
    workout_logs: {
      table: "workout_logs",
      rowCount: 1,
      rows: [{ id: "seed-log-1", exercise: "Push up", minutes: 10 }]
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

    await screen.findByText("Push up");
    fireEvent.click(screen.getByRole("button", { name: "DB 초기화" }));

    expect(await screen.findByText("DB 초기화 실패")).toBeInTheDocument();
    expect(screen.getByText("Push up")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows a delete failure when the backend rejects the mutation", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(snapshotResponse))
      .mockResolvedValueOnce(jsonResponse({ error: "untrusted origin" }, { ok: false, status: 403 }));

    render(<App />);

    await screen.findByText("Push up");
    fireEvent.click(screen.getByRole("button", { name: "최근 기록 삭제" }));

    expect(await screen.findByText("최근 기록 삭제 실패")).toBeInTheDocument();
    expect(screen.getByText("Push up")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows a save failure when the workout log request cannot reach the backend", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(snapshotResponse))
      .mockRejectedValueOnce(new TypeError("network down"));

    render(<App />);

    await screen.findByText("Push up");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByText("저장 실패")).toBeInTheDocument();
    expect(screen.getByText("Push up")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body
  } as Response;
}
