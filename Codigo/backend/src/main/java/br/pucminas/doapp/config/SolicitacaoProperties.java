package br.pucminas.doapp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Positive;

/**
 * Regras do cadastro de solicitações, lidas do bloco {@code doapp.solicitacoes} do {@code application.yml}.
 * Tamanho e tipos das fotos seguem {@code doapp.doacoes.fotos}, porque o armazenamento é o mesmo.
 */
@Validated
@ConfigurationProperties("doapp.solicitacoes")
public record SolicitacaoProperties(
        @Positive int tituloMaximo,
        @Positive int descricaoMaximo,
        @Positive int fotosMaximo) {
}
