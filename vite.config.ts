import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const harnessServerPort = env.VITE_HARNESS_SERVER_PORT ?? env.HARNESS_SERVER_PORT ?? "4317";

  return {
    define: {
      "import.meta.env.VITE_HARNESS_API_BASE_URL": JSON.stringify(env.VITE_HARNESS_API_BASE_URL ?? ""),
      "import.meta.env.VITE_HARNESS_SERVER_PORT": JSON.stringify(harnessServerPort)
    },
    plugins: [react()],
    server: {
      port: 5177
    }
  };
});
