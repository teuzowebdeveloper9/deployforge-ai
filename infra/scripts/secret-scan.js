const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const ignoredDirs = new Set(["node_modules", ".git", ".next", "dist", "build", "__pycache__"]);
const ignoredFiles = new Set(["secret-scan.js"]);
const suspiciousPatterns = [
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----/,
  /(?<![A-Z_])(api[_-]?key|token|password|secret)\s*[:=]\s*["']?(?!replace_me|localhost|deployforge_dev_password|postgresql:\/\/deployforge|redis:\/\/redis|http:\/\/localhost)[A-Za-z0-9_\-./+=]{20,}/i
];
const findings = [];

function shouldSkip(filePath, name) {
  if (ignoredFiles.has(name)) return true;
  return [".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".gz", ".zip"].some((suffix) =>
    filePath.endsWith(suffix)
  );
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (shouldSkip(fullPath, entry.name)) continue;
    const text = fs.readFileSync(fullPath, "utf8");
    suspiciousPatterns.forEach((pattern) => {
      if (pattern.test(text)) findings.push(path.relative(root, fullPath));
    });
  }
}

walk(root);

if (findings.length > 0) {
  console.error("Potential secrets found:");
  for (const finding of [...new Set(findings)]) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("Basic secret scan passed.");
