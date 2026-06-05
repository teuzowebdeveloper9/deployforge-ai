const COMMON_WEAK_TERMS = ["password", "senha", "deployforge", "qwerty", "123456"];

export interface PasswordPolicyCheck {
  id: string;
  label: string;
  valid: boolean;
}

export function passwordPolicyChecks(password: string): PasswordPolicyCheck[] {
  const normalized = password.toLowerCase();

  return [
    {
      id: "length",
      label: "12 a 128 caracteres",
      valid: password.length >= 12 && password.length <= 128
    },
    {
      id: "case",
      label: "Letra maiuscula e minuscula",
      valid: /[a-z]/.test(password) && /[A-Z]/.test(password)
    },
    {
      id: "number",
      label: "Pelo menos um numero",
      valid: /\d/.test(password)
    },
    {
      id: "symbol",
      label: "Pelo menos um simbolo",
      valid: /[^A-Za-z0-9\s]/.test(password)
    },
    {
      id: "no-space",
      label: "Sem espacos",
      valid: !/\s/.test(password)
    },
    {
      id: "not-common",
      label: "Sem termos fracos",
      valid: !COMMON_WEAK_TERMS.some((term) => normalized.includes(term))
    }
  ];
}

export function isStrongPassword(password: string) {
  return passwordPolicyChecks(password).every((check) => check.valid);
}
