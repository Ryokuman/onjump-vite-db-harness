import type { IncomingMessage } from "node:http";

const DEFAULT_MAX_BODY_BYTES = 64 * 1024;

export class RequestBodyError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
  }
}

export async function readJsonBody(
  request: IncomingMessage | AsyncIterable<Buffer | string | Uint8Array>,
  options: { maxBytes?: number } = {}
): Promise<unknown> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BODY_BYTES;
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;

    if (totalBytes > maxBytes) {
      throw new RequestBodyError(`Request body is too large. Max ${maxBytes} bytes are allowed.`, 413);
    }

    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw new RequestBodyError("Invalid JSON request body.", 400);
  }
}
