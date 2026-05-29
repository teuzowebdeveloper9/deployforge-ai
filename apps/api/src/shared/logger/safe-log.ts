const secretPatterns = [
  /(authorization:\s*bearer\s+)[^\s]+/gi,
  /((api[_-]?key|token|password|secret)\s*[:=]\s*)[^\s"'`]+/gi
];

export function redactSecrets(input: string): string {
  return secretPatterns.reduce((value, pattern) => value.replace(pattern, "$1[REDACTED]"), input);
}
