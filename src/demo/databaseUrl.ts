const DEFAULT_DATABASE_URL = "postgres://onjump:onjump@localhost:55432/onjump_harness";
const SAFE_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "db", "host.docker.internal"]);
const SAFE_DATABASE_NAME = /(harness|test|local|dev)/i;

export function resolveHarnessDatabaseUrl(env: Record<string, string | undefined> = process.env): string {
  const databaseUrl = env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  assertSafeHarnessDatabaseUrl(databaseUrl);
  return databaseUrl;
}

export function assertSafeHarnessDatabaseUrl(databaseUrl: string): void {
  const parsed = new URL(databaseUrl);

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error("Harness DATABASE_URL must use postgres or postgresql.");
  }

  const connectionTargetOverrides = ["host", "port", "database"];
  const override = connectionTargetOverrides.find((name) => parsed.searchParams.has(name));
  if (override) {
    throw new Error(`Harness DATABASE_URL must not include a ${override} query override.`);
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (!SAFE_HOSTS.has(hostname)) {
    throw new Error(
      `Unsafe database host "${parsed.hostname}". The harness only resets local or Docker database hosts.`
    );
  }

  const databaseName = parsed.pathname.replace(/^\//, "");
  if (!SAFE_DATABASE_NAME.test(databaseName)) {
    throw new Error(
      `Harness database name "${databaseName}" must include harness, test, local, or dev before reset can run.`
    );
  }
}

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^\[(.*)\]$/, "$1");
}
