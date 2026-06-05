const COMMON_WEAK_TERMS = ["password", "senha", "deployforge", "qwerty", "123456"];

export interface PasswordPolicyCheck {
  id: string;
  valid: boolean;
}

export interface PasswordPolicyResult {
  valid: boolean;
  checks: PasswordPolicyCheck[];
}

export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  const normalized = password.toLowerCase();
  const checks: PasswordPolicyCheck[] = [
    {
      id: "length",
      valid: password.length >= 12 && password.length <= 128
    },
    {
      id: "lowercase",
      valid: /[a-z]/.test(password)
    },
    {
      id: "uppercase",
      valid: /[A-Z]/.test(password)
    },
    {
      id: "number",
      valid: /\d/.test(password)
    },
    {
      id: "symbol",
      valid: /[^A-Za-z0-9\s]/.test(password)
    },
    {
      id: "no-space",
      valid: !/\s/.test(password)
    },
    {
      id: "not-common",
      valid: !COMMON_WEAK_TERMS.some((term) => normalized.includes(term))
    }
  ];

  return {
    valid: checks.every((check) => check.valid),
    checks
  };
}

export function passwordPolicyMessage() {
  return "Password must be 12-128 characters and include uppercase, lowercase, number, symbol, no spaces and no common weak terms";
}
