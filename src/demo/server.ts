import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Pool } from "pg";
import { PostgresDatabaseAdapter } from "../core/database";
import { createHarnessController } from "../core/controller";
import { getMockUser, workoutLogManifest, workoutLogSeedRows } from "./manifest";
import { buildWorkoutLogInsert, normalizeWorkoutLogInput } from "./workoutLog";
import { resolveHarnessDatabaseUrl } from "./databaseUrl";
import { readJsonBody, RequestBodyError } from "./requestBody";
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
  manifest: workoutLogManifest,
  adapter,
  seedRows: workoutLogSeedRows
});

async function bootstrap() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS workout_logs (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      exercise text NOT NULL,
      minutes integer NOT NULL,
      created_at timestamptz NOT NULL
    )
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
      sendJson(response, 200, workoutLogManifest);
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

    if (request.method === "POST" && request.url === "/api/workout-logs") {
      assertTrustedMutationOrigin(getOrigin(request), allowedOrigins);
      const body = await readJsonBody(request);
      const input = normalizeWorkoutLogInput(body as { exercise: unknown; minutes: unknown });
      const insert = buildWorkoutLogInsert({
        userId: getMockUser().id,
        input
      });

      await pool.query(
        `INSERT INTO workout_logs (id, user_id, exercise, minutes, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [insert.id, insert.user_id, insert.exercise, insert.minutes, insert.created_at]
      );

      sendJson(response, 201, insert);
      return;
    }

    if (request.method === "DELETE" && request.url?.startsWith("/api/workout-logs/")) {
      assertTrustedMutationOrigin(getOrigin(request), allowedOrigins);
      const id = decodeURIComponent(request.url.replace("/api/workout-logs/", ""));
      await pool.query("DELETE FROM workout_logs WHERE id = $1", [id]);
      sendJson(response, 200, await controller.snapshotTable("workout_logs"));
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
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
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
