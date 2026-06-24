import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Pool } from "pg";
import { PostgresDatabaseAdapter } from "../core/database";
import { createHarnessController } from "../core/controller";
import { foodLogManifest, foodLogSeedRows } from "./manifest";
import { resolveHarnessDatabaseUrl } from "./databaseUrl";
import { RequestBodyError } from "./requestBody";
import {
  assertTrustedMutationOrigin,
  getTrustedCorsOrigin,
  parseAllowedOrigins,
  TrustedOriginError
} from "./trustedOrigin";

const port = Number(process.env.HARNESS_SERVER_PORT ?? 4317);
const databaseUrl = resolveHarnessDatabaseUrl();
const allowedOrigins = parseAllowedOrigins();

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PostgresDatabaseAdapter(databaseUrl);
const controller = createHarnessController({
  manifest: foodLogManifest,
  adapter,
  seedRows: foodLogSeedRows
});

async function bootstrap() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS auth_provider_identities (
      user_id TEXT NOT NULL REFERENCES users(id),
      provider TEXT NOT NULL,
      provider_user_id TEXT NOT NULL,
      linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (provider, provider_user_id)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      goal_type TEXT NOT NULL,
      status TEXT NOT NULL,
      current_weight_kg NUMERIC,
      target_weight_kg NUMERIC,
      target_date DATE,
      tracking_strictness TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS daily_checks (
      user_id TEXT NOT NULL REFERENCES users(id),
      date DATE NOT NULL,
      food_status TEXT NOT NULL DEFAULT 'unset',
      workout_status TEXT NOT NULL DEFAULT 'unset',
      weight_status TEXT NOT NULL DEFAULT 'unset',
      completion_status TEXT NOT NULL DEFAULT 'incomplete',
      analysis_quality TEXT NOT NULL DEFAULT 'normal',
      PRIMARY KEY (user_id, date)
    );

    CREATE TABLE IF NOT EXISTS food_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      date DATE NOT NULL,
      name TEXT NOT NULL,
      calories INTEGER NOT NULL,
      meal_type TEXT NOT NULL,
      meal_time TEXT
    );

    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      date DATE NOT NULL,
      exercise_name TEXT NOT NULL,
      exercise_type TEXT NOT NULL,
      values JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weight_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      date DATE NOT NULL,
      weight_kg NUMERIC NOT NULL
    );
  `);
  await controller.resetAndSeed();
}

const server = createServer(async (request, response) => {
  try {
    setCorsHeaders(request, response);

    if (request.method === "OPTIONS") {
      if (!getTrustedCorsOrigin(getOrigin(request), allowedOrigins)) {
        sendJson(response, 403, { error: "untrusted origin" });
        return;
      }

      response.writeHead(204);
      response.end();
      return;
    }

    if (request.method === "GET" && request.url === "/__harness/manifest") {
      sendJson(response, 200, foodLogManifest);
      return;
    }

    if (request.method === "GET" && request.url === "/__harness/snapshot") {
      sendJson(response, 200, await controller.snapshot());
      return;
    }

    if (request.method === "POST" && request.url === "/__harness/reset") {
      assertTrustedMutationOrigin(getOrigin(request), allowedOrigins);
      await controller.resetAndSeed();
      sendJson(response, 200, await controller.snapshot());
      return;
    }

    sendJson(response, 404, { error: "not found" });
  } catch (error) {
    if (error instanceof TrustedOriginError) {
      sendJson(response, error.statusCode, { error: error.message });
      return;
    }

    if (error instanceof RequestBodyError) {
      sendJson(response, error.statusCode, { error: error.message });
      return;
    }

    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "unknown error"
    });
  }
});

await bootstrap();
server.listen(port, () => {
  console.log(`Harness server listening on http://localhost:${port}`);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function shutdown() {
  server.close();
  await adapter.close();
  await pool.end();
  process.exit(0);
}

function setCorsHeaders(request: IncomingMessage, response: ServerResponse) {
  const trustedOrigin = getTrustedCorsOrigin(getOrigin(request), allowedOrigins);
  if (trustedOrigin) {
    response.setHeader("Access-Control-Allow-Origin", trustedOrigin);
  }
  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "content-type");
}

function getOrigin(request: IncomingMessage): string | undefined {
  const origin = request.headers.origin;
  return Array.isArray(origin) ? origin[0] : origin;
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}
