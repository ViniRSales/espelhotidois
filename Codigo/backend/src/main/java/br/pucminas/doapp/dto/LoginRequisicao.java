package br.pucminas.doapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Dados do login. Com {@code manterConectado}, a sessão dura mais e o front-end guarda o token
 * no {@code localStorage}; sem ele, a sessão é curta e fica só na aba aberta.
 */
public record LoginRequisicao(
        @NotBlank(message = "Informe seu e-mail.")
        String email,

        @NotBlank(message = "Informe sua senha.")
        @Size(max = 72, message = "Use no máximo 72 caracteres.")
        String senha,

        /** Opcional; sem ele, a sessão é a curta. */
        Boolean manterConectado) {

    public LoginRequisicao {
        email = CadastroRequisicao.normalizarEmail(email);
        manterConectado = Boolean.TRUE.equals(manterConectado);
    }

    /** Nunca mostra a senha em logs ou mensagens de erro. */
    @Override
    public String toString() {
        return "LoginRequisicao[email=%s, manterConectado=%s]".formatted(email, manterConectado);
    }
}
