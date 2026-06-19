const DEFAULT_HARNESS_SERVER_PORT = "4317";

type HarnessEnv = Record<string, string | undefined>;

export function resolveHarnessApiBaseUrl(env: HarnessEnv = getRuntimeEnv()): string {
  const explicitBaseUrl = env.VITE_HARNESS_API_BASE_URL ?? env.HARNESS_API_BASE_URL;
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  const port = env.VITE_HARNESS_SERVER_PORT ?? env.HARNESS_SERVER_PORT ?? DEFAULT_HARNESS_SERVER_PORT;
  return `http://localhost:${port}`;
}

function getRuntimeEnv(): HarnessEnv {
  const nodeEnv = typeof process === "undefined" ? {} : process.env;
  const viteEnv = (import.meta as ImportMeta & { env?: HarnessEnv }).env ?? {};

  return {
    ...nodeEnv,
    ...viteEnv
  };
}
