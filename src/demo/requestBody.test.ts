import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { readJsonBody } from "./requestBody";

describe("readJsonBody", () => {
  it("parses a small JSON request body", async () => {
    await expect(readJsonBody(requestFrom('{"exercise":"Squat"}'))).resolves.toEqual({
      exercise: "Squat"
    });
  });

  it("rejects request bodies over the configured limit", async () => {
    const body = JSON.stringify({ value: "x".repeat(12) });

    await expect(readJsonBody(requestFrom(body), { maxBytes: 8 })).rejects.toThrow(/too large/i);
  });

  it("reports malformed JSON as a bad request", async () => {
    await expect(readJsonBody(requestFrom("{"), { maxBytes: 8 })).rejects.toThrow(/invalid json/i);
  });
});

function requestFrom(body: string) {
  return Readable.from([Buffer.from(body)]);
}
