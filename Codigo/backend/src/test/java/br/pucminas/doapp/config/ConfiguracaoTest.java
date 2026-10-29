package br.pucminas.doapp.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;

/** Confere que o {@code application.yml} carrega as configurações da forma esperada. */
class ConfiguracaoTest {

    /** Só as propriedades do JWT, sem os beans que dependem do MongoDB. */
    @Configuration
    @EnableConfigurationProperties(JwtProperties.class)
    static class SoJwt {
    }

    private final ApplicationContextRunner contexto = new ApplicationContextRunner()
            .withInitializer(new ConfigDataApplicationContextInitializer())
            .withUserConfiguration(AplicacaoConfig.class, SoJwt.class);

    @Test
    void carregaAsRegrasDeDoacao() {
        contexto.run(ctx -> {
            var doacoes = ctx.getBean(DoacaoProperties.class);

            assertThat(doacoes.prazoDisponivel()).isEqualTo(Duration.ofDays(30));
            assertThat(doacoes.tituloMaximo()).isEqualTo(90);
            assertThat(doacoes.descricaoMaximo()).isEqualTo(300);
            assertThat(doacoes.tagsMaximo()).isEqualTo(5);
            assertThat(doacoes.fotos().diretorio().normalize()).isEqualTo(Path.of("uploads", "fotos"));
            assertThat(doacoes.fotos().minimo()).isEqualTo(1);
            assertThat(doacoes.fotos().maximo()).isEqualTo(10);
            assertThat(doacoes.fotos().tamanhoMaximo()).isEqualTo(DataSize.ofMegabytes(5));
            assertThat(doacoes.fotos().tiposPermitidos()).containsExactly("image/jpeg", "image/png", "image/webp");
        });
    }

    @Test
    void relogioUsaOFusoDaAplicacao() {
        contexto.run(ctx -> assertThat(ctx.getBean(Clock.class).getZone()).isEqualTo(ZoneId.of("America/Sao_Paulo")));
    }

    @Test
    void carregaAsRegrasDoTokenDeLogin() {
        contexto.run(ctx -> {
            var jwt = ctx.getBean(JwtProperties.class);

            assertThat(jwt.emissor()).isEqualTo("doapp");
            assertThat(jwt.duracaoPadrao()).isEqualTo(Duration.ofHours(12));
            assertThat(jwt.duracaoEstendida()).isEqualTo(Duration.ofDays(7));
        });
    }

    @Test
    void carregaAsRegrasDaRecuperacaoDeSenha() {
        contexto.run(ctx -> {
            var recuperacao = ctx.getBean(RecuperacaoSenhaProperties.class);

            assertThat(recuperacao.validade()).isEqualTo(Duration.ofMinutes(30));
            assertThat(recuperacao.intervaloMinimo()).isEqualTo(Duration.ofMinutes(2));
            assertThat(recuperacao.urlApp()).isEqualTo("http://localhost:5173");
            // Só o perfil dev escreve o link no log.
            assertThat(recuperacao.registrarLinkNoLog()).isTrue();
        });
        contexto.withPropertyValues("spring.profiles.active=prod", "doapp.jwt.segredo=" + "a".repeat(40))
                .run(ctx -> assertThat(ctx.getBean(RecuperacaoSenhaProperties.class).registrarLinkNoLog()).isFalse());
    }

    @Test
    void semPerfilInformadoUsaAChaveDeDesenvolvimento() {
        contexto.run(ctx -> assertThat(ctx.getBean(JwtProperties.class).segredo()).hasSizeGreaterThanOrEqualTo(32));
    }

    @Test
    void foraDoPerfilDevAApiNaoSobeSemJwtSegredo() {
        contexto.withPropertyValues("spring.profiles.active=prod")
                .run(ctx -> assertThat(ctx).hasFailed());
    }

    @Test
    void recusaJwtSegredoCurto() {
        contexto.withPropertyValues("spring.profiles.active=prod", "doapp.jwt.segredo=curto")
                .run(ctx -> assertThat(ctx).hasFailed());
    }

    @Test
    void emProducaoUsaOJwtSegredoInformado() {
        String segredo = "a".repeat(40);
        contexto.withPropertyValues("spring.profiles.active=prod", "doapp.jwt.segredo=" + segredo)
                .run(ctx -> assertThat(ctx.getBean(JwtProperties.class).segredo()).isEqualTo(segredo));
    }
}
