const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5177", "http://127.0.0.1:5177"];

export class TrustedOriginError extends Error {
  readonly statusCode = 403;
}

export function parseAllowedOrigins(env: Record<string, string | undefined> = process.env): string[] {
  const raw = env.HARNESS_ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function assertTrustedMutationOrigin(origin: string | undefined, allowedOrigins: string[]): void {
  if (!origin) return;

  if (!allowedOrigins.includes(origin)) {
    throw new TrustedOriginError(`Untrusted origin "${origin}" cannot mutate the harness database.`);
  }
}

export function getTrustedCorsOrigin(origin: string | undefined, allowedOrigins: string[]): string | null {
  if (!origin) return allowedOrigins[0] ?? null;
  return allowedOrigins.includes(origin) ? origin : null;
}
