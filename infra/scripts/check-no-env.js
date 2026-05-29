const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const ignoredDirs = new Set(["node_modules", ".git", ".next", "dist", "build", "__pycache__"]);
const forbidden = [/^\.env$/, /^\.env\.(?!example$).+$/, /^\.env\.local$/];
const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (forbidden.some((pattern) => pattern.test(entry.name))) {
      violations.push(path.relative(root, fullPath));
    }
  }
}

walk(root);

if (violations.length > 0) {
  console.error("Forbidden real env files found:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("No real env files found.");
