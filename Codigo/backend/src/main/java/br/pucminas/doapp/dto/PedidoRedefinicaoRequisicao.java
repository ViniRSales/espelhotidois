package br.pucminas.doapp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** "Esqueci minha senha": o e-mail da conta. */
public record PedidoRedefinicaoRequisicao(
        @NotBlank(message = "Informe seu e-mail.")
        @Email(regexp = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+", message = CadastroRequisicao.EMAIL_INVALIDO)
        String email) {

    public PedidoRedefinicaoRequisicao {
        email = CadastroRequisicao.normalizarEmail(email);
    }
}
