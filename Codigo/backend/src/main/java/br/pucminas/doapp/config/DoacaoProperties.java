package br.pucminas.doapp.config;

import java.nio.file.Path;
import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Regras do cadastro de doações, lidas do bloco {@code doapp.doacoes} do {@code application.yml}. */
@Validated
@ConfigurationProperties("doapp.doacoes")
public record DoacaoProperties(
        @Positive int diasDisponivel,
        @NotBlank String expiracaoCron,
        @Positive int tituloMaximo,
        @Positive int descricaoMaximo,
        @Positive int tagsMaximo,
        @Valid @NotNull Fotos fotos) {

    /** Por quanto tempo uma doação fica disponível depois de publicada. */
    public Duration prazoDisponivel() {
        return Duration.ofDays(diasDisponivel);
    }

    public record Fotos(
            @NotNull Path diretorio,
            @Positive int minimo,
            @Positive int maximo,
            @NotNull DataSize tamanhoMaximo,
            @NotEmpty List<String> tiposPermitidos) {
    }
}
