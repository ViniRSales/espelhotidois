package br.pucminas.doapp.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Validated
@ConfigurationProperties("doapp.recuperacao-senha")
public record RecuperacaoSenhaProperties(
        @NotNull Duration validade,
        @NotNull Duration intervaloMinimo,
        @NotBlank String urlApp,
        @NotBlank String remetente,
        boolean registrarLinkNoLog) {
}
