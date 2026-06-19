import { describe, expect, it } from "vitest";
import { resolveHarnessApiBaseUrl } from "./apiBaseUrl";

describe("resolveHarnessApiBaseUrl", () => {
  it("uses the default harness server port", () => {
    expect(resolveHarnessApiBaseUrl({})).toBe("http://localhost:4317");
  });

  it("uses the configured harness server port", () => {
    expect(resolveHarnessApiBaseUrl({ HARNESS_SERVER_PORT: "4999" })).toBe("http://localhost:4999");
  });

  it("prefers the Vite-exposed harness server port", () => {
    expect(
      resolveHarnessApiBaseUrl({
        HARNESS_SERVER_PORT: "4999",
        VITE_HARNESS_SERVER_PORT: "4888"
      })
    ).toBe("http://localhost:4888");
  });

  it("uses an explicit API base URL when provided", () => {
    expect(
      resolveHarnessApiBaseUrl({
        HARNESS_SERVER_PORT: "4999",
        VITE_HARNESS_API_BASE_URL: "http://127.0.0.1:4555"
      })
    ).toBe("http://127.0.0.1:4555");
  });
});
