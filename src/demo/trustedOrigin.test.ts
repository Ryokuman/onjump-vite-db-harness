import { describe, expect, it } from "vitest";
import { TrustedOriginError, assertTrustedMutationOrigin, parseAllowedOrigins } from "./trustedOrigin";

describe("parseAllowedOrigins", () => {
  it("uses Vite localhost origins by default", () => {
    expect(parseAllowedOrigins({})).toEqual([
      "http://localhost:5177",
      "http://127.0.0.1:5177"
    ]);
  });
});

describe("assertTrustedMutationOrigin", () => {
  it("allows trusted Vite origins", () => {
    expect(() =>
      assertTrustedMutationOrigin("http://localhost:5177", ["http://localhost:5177"])
    ).not.toThrow();
  });

  it("allows non-browser requests without an Origin header", () => {
    expect(() => assertTrustedMutationOrigin(undefined, ["http://localhost:5177"])).not.toThrow();
  });

  it("rejects mutating requests from untrusted browser origins", () => {
    expect(() =>
      assertTrustedMutationOrigin("https://malicious.example", ["http://localhost:5177"])
    ).toThrow(TrustedOriginError);
  });
});
