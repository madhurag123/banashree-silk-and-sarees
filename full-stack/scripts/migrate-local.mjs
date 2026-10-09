import fs from "node:fs";
import { spawnSync } from "node:child_process";
const marker = ".sites-runtime/local-migrations.json";
const applied = fs.existsSync(marker)
  ? JSON.parse(fs.readFileSync(marker, "utf8"))
  : [];
for (const file of fs
  .readdirSync("drizzle")
  .filter((x) => x.endsWith(".sql"))
  .sort()) {
  if (applied.includes(file)) continue;
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "./scripts/sites-env.mjs",
      "./node_modules/wrangler/bin/wrangler.js",
      "d1",
      "execute",
      "DB",
      "--local",
      "--config",
      "dist/server/wrangler.json",
      "--persist-to",
      ".wrangler/state",
      "--file",
      "drizzle/" + file,
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status || 1);
  applied.push(file);
  fs.mkdirSync(".sites-runtime", { recursive: true });
  fs.writeFileSync(marker, JSON.stringify(applied));
}
console.log("Local database migrations are up to date.");
