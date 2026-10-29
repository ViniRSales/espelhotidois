package br.pucminas.doapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequisicao(
        @NotBlank(message = "Informe seu e-mail.")
        String email,

        @NotBlank(message = "Informe sua senha.")
        @Size(max = 72, message = "Use no máximo 72 caracteres.")
        String senha,

        Boolean manterConectado) {

    public LoginRequisicao {
        email = CadastroRequisicao.normalizarEmail(email);
        manterConectado = Boolean.TRUE.equals(manterConectado);
    }

    @Override
    public String toString() {
        return "LoginRequisicao[email=%s, manterConectado=%s]".formatted(email, manterConectado);
    }
}
