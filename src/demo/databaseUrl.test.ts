import { describe, expect, it } from "vitest";
import { assertSafeHarnessDatabaseUrl, resolveHarnessDatabaseUrl } from "./databaseUrl";

describe("assertSafeHarnessDatabaseUrl", () => {
  it("accepts the local Docker harness database", () => {
    expect(() =>
      assertSafeHarnessDatabaseUrl("postgres://onjump:onjump@localhost:55432/onjump_harness")
    ).not.toThrow();
  });

  it("rejects non-local database hosts before reset can run", () => {
    expect(() =>
      assertSafeHarnessDatabaseUrl("postgres://user:password@prod-db.example.com:5432/onjump")
    ).toThrow(/unsafe database host/i);
  });

  it("rejects local databases that are not clearly test harness databases", () => {
    expect(() =>
      assertSafeHarnessDatabaseUrl("postgres://onjump:onjump@localhost:5432/onjump")
    ).toThrow(/must include/i);
  });
});

describe("resolveHarnessDatabaseUrl", () => {
  it("uses the safe default when DATABASE_URL is absent", () => {
    expect(resolveHarnessDatabaseUrl({})).toBe("postgres://onjump:onjump@localhost:55432/onjump_harness");
  });
});
