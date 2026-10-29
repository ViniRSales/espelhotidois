package br.pucminas.doapp.dto;

import br.pucminas.doapp.service.RecuperacaoSenhaService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Senha nova e o token do link enviado por e-mail. A senha segue as mesmas regras do cadastro. */
public record RedefinicaoSenhaRequisicao(
        @NotBlank(message = RecuperacaoSenhaService.LINK_INVALIDO)
        String token,

        @NotNull(message = CadastroRequisicao.SENHA_CURTA)
        @Size(min = 8, message = CadastroRequisicao.SENHA_CURTA)
        @Size(max = 72, message = "Use no máximo 72 caracteres.")
        String senha) {

    /** Nunca mostra a senha nem o token em logs ou mensagens de erro. */
    @Override
    public String toString() {
        return "RedefinicaoSenhaRequisicao[]";
    }
}
