/** Regras espelhadas do RegisterCommandValidator/ResetPasswordCommandValidator do backend. */
export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "No mínimo 8 caracteres", test: (p) => p.length >= 8 },
  { id: "upper", label: "Uma letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Uma letra minúscula", test: (p) => /[a-z]/.test(p) },
  { id: "digit", label: "Um número", test: (p) => /[0-9]/.test(p) },
  {
    id: "special",
    label: "Um caractere especial (!@#$…)",
    test: (p) => /[^a-zA-Z0-9]/.test(p),
  },
];

export function passwordIsValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
