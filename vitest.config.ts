import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://127.0.0.1:27017/invictus_test",
      MONGODB_DB_NAME: "invictus_db",
      MONGODB_SANDBOX_DB_NAME: "invictus_sandbox",
      MONGODB_TEST_DB_NAME: "invictus_test",
    },
  },
});
