package br.pucminas.doapp.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** "Esqueci minha senha", lido do bloco {@code doapp.recuperacao-senha} do {@code application.yml}. */
@Validated
@ConfigurationProperties("doapp.recuperacao-senha")
public record RecuperacaoSenhaProperties(
        /** Por quanto tempo o link enviado por e-mail vale. */
        @NotNull Duration validade,
        /** Intervalo mínimo entre dois e-mails para a mesma conta. */
        @NotNull Duration intervaloMinimo,
        /** Endereço do front-end, usado para montar o link do e-mail. */
        @NotBlank String urlApp,
        /** Remetente dos e-mails, por exemplo {@code Doapp <nao-responda@doapp.com.br>}. */
        @NotBlank String remetente,
        /** Só em desenvolvimento: escreve o link no log, para testar sem servidor de e-mail. */
        boolean registrarLinkNoLog) {
}
