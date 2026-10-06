import { cp, mkdir, writeFile, rm } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, ".vercel/output");

// Clean output dir
await rm(out, { recursive: true, force: true });

// 1. Build api-server → artifacts/api-server/dist/
console.log("Building api-server...");
execSync("pnpm --filter @workspace/api-server run build", {
  cwd: root,
  stdio: "inherit",
});

// 2. Build frontend → artifacts/document-vault/dist/
console.log("Building frontend...");
execSync("pnpm --filter @workspace/document-vault run vercel-build", {
  cwd: root,
  stdio: "inherit",
});

// 3. Write .vercel/output/config.json
await mkdir(out, { recursive: true });
await writeFile(
  path.join(out, "config.json"),
  JSON.stringify({
    version: 3,
    routes: [
      { src: "/api/(.*)", dest: "/api" },
      { handle: "filesystem" },
      { src: "/(.*)", dest: "/index.html" },
    ],
  })
);

// 4. Copy static frontend files
const staticDir = path.join(out, "static");
await cp(
  path.join(root, "artifacts/document-vault/dist"),
  staticDir,
  { recursive: true }
);
console.log("Copied frontend to .vercel/output/static/");

// 5. Write serverless function for /api
const funcDir = path.join(out, "functions/api.func");
await mkdir(funcDir, { recursive: true });

// Copy the bundled api-server dist
await cp(
  path.join(root, "artifacts/api-server/dist"),
  funcDir,
  { recursive: true }
);

// Write the function entry - must be CJS-compatible handler
await writeFile(
  path.join(funcDir, "index.mjs"),
  [
    `import app from "./app.mjs";`,
    `export default async function handler(req, res) {`,
    `  await new Promise((resolve, reject) => {`,
    `    app(req, res, (err) => err ? reject(err) : resolve());`,
    `  });`,
    `}`,
  ].join("\n") + "\n"
);

// Write .vc-config.json for the function
await writeFile(
  path.join(funcDir, ".vc-config.json"),
  JSON.stringify({
    runtime: "nodejs22.x",
    handler: "index.mjs",
    launcherType: "Nodejs",
    shouldAddHelpers: true,
    supportsResponseStreaming: false,
  })
);

console.log("Wrote serverless function to .vercel/output/functions/api.func/");
console.log("Build complete.");
