export const useValidations = () => {
    const required = (val: string | number | null | undefined) => {
        return !!val || "Campo obrigatório";
    };

    const emailFormat = (val: string) => {
        const pattern = /.+@.+\..+/;
        return pattern.test(val) || "E-mail inválido";
    };

    const passwordStrength = (val: string): true | string => {
        if (val.length < 8) return "A senha deve ter no mínimo 8 caracteres";
        if (!/[A-Z]/.test(val)) return "Deve conter pelo menos uma letra maiúscula";
        if (!/[0-9]/.test(val)) return "Deve conter pelo menos um número";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(val))
            return "Deve conter pelo menos um caractere especial";
        return true;
    };

    const passwordRules = (val: string) => {
        if (!val) return "Senha é obrigatória";
        return passwordStrength(val);
    };

    const optionalPasswordRules = (val: string) => {
        if (!val) return true;
        return passwordStrength(val);
    };

    const confirmPasswordRules = (compareValue: string) => {
        return (val: string) => val === compareValue || "As senhas não coincidem.";
    };

    const digits = (val: string | null | undefined) => (val || "").replace(/\D/g, "");

    const phoneFormat = (val: string) => {
        const len = digits(val).length;
        return len === 10 || len === 11 || "Telefone inválido";
    };

    const cpfFormat = (val: string) => digits(val).length === 11 || "CPF inválido";

    const cnpjFormat = (val: string) => digits(val).length === 14 || "CNPJ inválido";

    const cepFormat = (val: string) => digits(val).length === 8 || "CEP inválido";

    const positiveNumber = (val: number | string | null | undefined) => {
        if (val === "" || val === null || val === undefined || Number.isNaN(Number(val))) {
            return "Campo obrigatório";
        }
        return Number(val) > 0 || "Deve ser maior que zero";
    };

    return {
        required,
        emailFormat,
        passwordRules,
        optionalPasswordRules,
        confirmPasswordRules,
        phoneFormat,
        cpfFormat,
        cnpjFormat,
        cepFormat,
        positiveNumber,
    };
};
