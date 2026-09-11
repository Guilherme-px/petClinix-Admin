import { describe, it, expect } from "vitest";
import { useValidations } from "../../composables/useValidations";

describe("useValidations", () => {
    const { required, emailFormat, passwordRules, confirmPasswordRules } = useValidations();

    it("required should return message if empty and true if filled", () => {
        expect(required("")).toBe("Campo obrigatório");
        expect(required("texto")).toBe(true);
    });

    it("emailFormat should validate email format", () => {
        expect(emailFormat("teste@teste.com")).toBe(true);
        expect(emailFormat("teste_invalido")).toBe("E-mail inválido");
    });

    it("passwordRules should require 8 chars, uppercase, and special char", () => {
        expect(passwordRules("")).toBe("Senha é obrigatória");
        expect(passwordRules("123")).toBe("A senha deve ter no mínimo 8 caracteres");
        expect(passwordRules("12345678")).toBe("Deve conter pelo menos uma letra maiúscula");
        expect(passwordRules("12345678A")).toBe("Deve conter pelo menos um caractere especial");
        expect(passwordRules("12345678A@")).toBe(true);
    });

    it("confirmPasswordRules should validate if passwords match", () => {
        const validateConfirm = confirmPasswordRules("Password@123");

        expect(validateConfirm("Password@123")).toBe(true);
        expect(validateConfirm("DifferentPass@")).toBe("As senhas não coincidem.");
    });
});
