import { redactSecrets } from "../src/shared/logger/safe-log";

describe("redactSecrets", () => {
  it("redacts obvious secret values", () => {
    const result = redactSecrets("token=abcd1234 password:super-secret authorization: Bearer abc.def");
    expect(result).toContain("token=[REDACTED]");
    expect(result).toContain("password:[REDACTED]");
    expect(result).toContain("authorization: Bearer [REDACTED]");
  });
});
