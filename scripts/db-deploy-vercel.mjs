import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const args = ["prisma", "migrate", "deploy", "--schema", "prisma/schema.postgres.prisma"];

const result = spawnSync(command, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1",
  },
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
