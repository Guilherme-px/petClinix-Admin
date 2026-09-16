import { describe, it, expect } from "vitest";
import { useValidations } from "../../composables/useValidations";

describe("useValidations", () => {
    const {
        required,
        emailFormat,
        passwordRules,
        optionalPasswordRules,
        confirmPasswordRules,
        phoneFormat,
        cpfFormat,
        cnpjFormat,
        cepFormat,
    } = useValidations();

    it("required should return message if empty and true if filled", () => {
        expect(required("")).toBe("Campo obrigatório");
        expect(required("texto")).toBe(true);
    });

    it("emailFormat should validate email format", () => {
        expect(emailFormat("teste@teste.com")).toBe(true);
        expect(emailFormat("teste_invalido")).toBe("E-mail inválido");
    });

    it("passwordRules should require 8 chars, uppercase, number and special char", () => {
        expect(passwordRules("")).toBe("Senha é obrigatória");
        expect(passwordRules("123")).toBe("A senha deve ter no mínimo 8 caracteres");
        expect(passwordRules("12345678")).toBe("Deve conter pelo menos uma letra maiúscula");
        expect(passwordRules("12345678A")).toBe("Deve conter pelo menos um caractere especial");
        expect(passwordRules("ABCD@(lks")).toBe("Deve conter pelo menos um número");
        expect(passwordRules("12345678A@")).toBe(true);
    });

    it("optionalPasswordRules should pass when empty and apply strength rules when filled", () => {
        expect(optionalPasswordRules("")).toBe(true);
        expect(optionalPasswordRules(undefined as unknown as string)).toBe(true);
        expect(optionalPasswordRules("123")).toBe("A senha deve ter no mínimo 8 caracteres");
        expect(optionalPasswordRules("12345678")).toBe(
            "Deve conter pelo menos uma letra maiúscula",
        );
        expect(optionalPasswordRules("12345678A")).toBe(
            "Deve conter pelo menos um caractere especial",
        );
        expect(optionalPasswordRules("ABCD@(lks")).toBe("Deve conter pelo menos um número");
        expect(optionalPasswordRules("12345678A@")).toBe(true);
    });

    it("confirmPasswordRules should validate if passwords match", () => {
        const validateConfirm = confirmPasswordRules("Password@123");

        expect(validateConfirm("Password@123")).toBe(true);
        expect(validateConfirm("DifferentPass@")).toBe("As senhas não coincidem.");
    });

    it("phoneFormat should accept 10 or 11 digits", () => {
        expect(phoneFormat("")).toBe("Telefone inválido");
        expect(phoneFormat("119999988")).toBe("Telefone inválido");
        expect(phoneFormat("11999998")).toBe("Telefone inválido");
        expect(phoneFormat("1133334444")).toBe(true);
        expect(phoneFormat("11999998888")).toBe(true);
        expect(phoneFormat("(11) 99999-8888")).toBe(true);
    });

    it("cpfFormat should require 11 digits", () => {
        expect(cpfFormat("")).toBe("CPF inválido");
        expect(cpfFormat("1234567890")).toBe("CPF inválido");
        expect(cpfFormat("12345678900")).toBe(true);
        expect(cpfFormat("123.456.789-00")).toBe(true);
    });

    it("cnpjFormat should require 14 digits", () => {
        expect(cnpjFormat("")).toBe("CNPJ inválido");
        expect(cnpjFormat("1234567800019")).toBe("CNPJ inválido");
        expect(cnpjFormat("12345678000199")).toBe(true);
        expect(cnpjFormat("12.345.678/0001-99")).toBe(true);
    });

    it("cepFormat should require 8 digits", () => {
        expect(cepFormat("")).toBe("CEP inválido");
        expect(cepFormat("0100100")).toBe("CEP inválido");
        expect(cepFormat("01001000")).toBe(true);
        expect(cepFormat("01001-000")).toBe(true);
    });
});
