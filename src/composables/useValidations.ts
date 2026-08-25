export const useValidations = () => {
    const required = (val: string | number | null | undefined) => {
        return !!val || "Campo obrigatório";
    };

    const emailFormat = (val: string) => {
        const pattern = /.+@.+\..+/;
        return pattern.test(val) || "E-mail inválido";
    };

    const passwordRules = (val: string) => {
        if (!val) return "Senha é obrigatória";
        if (val.length < 8) return "A senha deve ter no mínimo 8 caracteres";
        if (!/[A-Z]/.test(val)) return "Deve conter pelo menos uma letra maiúscula";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(val))
            return "Deve conter pelo menos um caractere especial";
        return true;
    };

    return {
        required,
        emailFormat,
        passwordRules,
    };
};
