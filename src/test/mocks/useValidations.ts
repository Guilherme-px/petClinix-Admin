export const validationsMock = {
    required: (val: string | number | null | undefined) => !!val || "Campo obrigatório",
    emailFormat: (val: string) => /.+@.+\..+/.test(val) || "E-mail inválido",
    passwordRules: (val: string) => {
        if (!val) return "Senha é obrigatória";
        return passwordStrengthMock(val);
    },
    optionalPasswordRules: (val: string) => {
        if (!val) return true;
        return passwordStrengthMock(val);
    },
    confirmPasswordRules: (compareValue: string) => (val: string) =>
        val === compareValue || "As senhas não coincidem.",
};

const passwordStrengthMock = (val: string): true | string => {
    if (val.length < 8) return "A senha deve ter no mínimo 8 caracteres";
    if (!/[A-Z]/.test(val)) return "Deve conter pelo menos uma letra maiúscula";
    if (!/[0-9]/.test(val)) return "Deve conter pelo menos um número";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(val))
        return "Deve conter pelo menos um caractere especial";
    return true;
};
