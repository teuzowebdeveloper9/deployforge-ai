import { validatePasswordPolicy } from "../src/shared/security/password-policy";

describe("password policy", () => {
  it("accepts strong passwords", () => {
    expect(validatePasswordPolicy("Deploy@2026Safe").valid).toBe(true);
  });

  it("rejects weak passwords", () => {
    expect(validatePasswordPolicy("short").valid).toBe(false);
    expect(validatePasswordPolicy("deployforge@2026").valid).toBe(false);
    expect(validatePasswordPolicy("Deployforge2026").valid).toBe(false);
    expect(validatePasswordPolicy("Deploy @2026").valid).toBe(false);
  });
});
