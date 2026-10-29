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

/**
 * Token de login, lido do bloco {@code doapp.jwt} do {@code application.yml}.
 * Sem um segredo de pelo menos 32 caracteres a API não sobe (variável {@code JWT_SEGREDO}).
 */
@Validated
@ConfigurationProperties("doapp.jwt")
public record JwtProperties(
        @NotBlank(message = "Defina JWT_SEGREDO (pelo menos 32 caracteres).")
        @Size(min = 32, message = "JWT_SEGREDO precisa ter pelo menos 32 caracteres.")
        String segredo,
        @NotBlank String emissor,
        /** Sessão sem "manter conectado". */
        @NotNull Duration duracaoPadrao,
        /** Sessão com "manter conectado" e logo depois de criar a conta. */
        @NotNull Duration duracaoEstendida) {

    /** Chave do HMAC-SHA256 que assina e confere os tokens. */
    public SecretKey chave() {
        return new SecretKeySpec(segredo.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    /** O segredo nunca aparece em logs nem em mensagens de erro de configuração. */
    @Override
    public String toString() {
        return "JwtProperties[emissor=%s, duracaoPadrao=%s, duracaoEstendida=%s]"
                .formatted(emissor, duracaoPadrao, duracaoEstendida);
    }
}
