package br.pucminas.doapp.config;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Validated
@ConfigurationProperties("doapp.jwt")
public record JwtProperties(
        @NotBlank(message = "Defina JWT_SEGREDO (pelo menos 32 caracteres).")
        @Size(min = 32, message = "JWT_SEGREDO precisa ter pelo menos 32 caracteres.")
        String segredo,
        @NotBlank String emissor,
        @NotNull Duration duracaoPadrao,
        @NotNull Duration duracaoEstendida) {

    public SecretKey chave() {
        return new SecretKeySpec(segredo.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Override
    public String toString() {
        return "JwtProperties[emissor=%s, duracaoPadrao=%s, duracaoEstendida=%s]"
                .formatted(emissor, duracaoPadrao, duracaoEstendida);
    }
}
