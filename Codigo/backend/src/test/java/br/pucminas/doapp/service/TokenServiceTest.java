package br.pucminas.doapp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidationException;

import br.pucminas.doapp.config.JwtConfig;
import br.pucminas.doapp.config.JwtProperties;
import br.pucminas.doapp.model.LocalizacaoConta;
import br.pucminas.doapp.model.TipoConta;
import br.pucminas.doapp.model.TokenRevogado;
import br.pucminas.doapp.model.Usuario;
import br.pucminas.doapp.repository.TokenRevogadoRepository;
import br.pucminas.doapp.repository.UsuarioRepository;
import br.pucminas.doapp.service.TokenService.TokenEmitido;

class TokenServiceTest {

    static final JwtProperties JWT = new JwtProperties("segredo-de-teste-com-mais-de-32-caracteres", "doapp",
            Duration.ofHours(12), Duration.ofDays(7));

    private final TokenRevogadoRepository revogados = mock(TokenRevogadoRepository.class);
    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final JwtConfig config = new JwtConfig();
    private final JwtDecoder decoder = config.jwtDecoder(JWT, revogados, usuarios);
    private final Usuario usuario = new Usuario(TipoConta.PESSOA_FISICA, "Maria", "maria@email.com", "31999998888",
            new LocalizacaoConta("Savassi", "Belo Horizonte", "MG"), "hash", Instant.now());

    @BeforeEach
    void contaExiste() {
        when(usuarios.findById("u1")).thenReturn(Optional.of(usuario));
    }

    private TokenService servico(Instant agora) {
        return new TokenService(config.jwtEncoder(JWT), JWT, revogados, Clock.fixed(agora, ZoneOffset.UTC));
    }

    @Test
    void tokenLevaSoOIdDoUsuarioEExpiraNoPrazo() {
        Instant agora = Instant.now();

        TokenEmitido emitido = servico(agora).emitir("u1", 0, false);
        Jwt jwt = decoder.decode(emitido.token());

        assertThat(jwt.getSubject()).isEqualTo("u1");
        assertThat(jwt.getClaimAsString("iss")).isEqualTo("doapp");
        assertThat(jwt.getId()).isNotBlank();
        assertThat(jwt.getClaims()).containsOnlyKeys("sub", "iss", "iat", "exp", "jti", "sv");
        assertThat(emitido.expiraEm()).isEqualTo(agora.plus(Duration.ofHours(12)));
    }

    @Test
    void sessaoEstendidaDuraSeteDias() {
        Instant agora = Instant.now();

        assertThat(servico(agora).emitir("u1", 0, true).expiraEm()).isEqualTo(agora.plus(Duration.ofDays(7)));
    }

    @Test
    void cadaTokenTemUmIdProprio() {
        TokenService servico = servico(Instant.now());

        String a = decoder.decode(servico.emitir("u1", 0, false).token()).getId();
        String b = decoder.decode(servico.emitir("u1", 0, false).token()).getId();

        assertThat(a).isNotEqualTo(b);
    }

    @Test
    void recusaTokenVencido() {
        String token = servico(Instant.now().minus(Duration.ofDays(8))).emitir("u1", 0, true).token();

        assertThatThrownBy(() -> decoder.decode(token)).isInstanceOf(JwtValidationException.class);
    }

    @Test
    void recusaTokenAssinadoComOutraChave() {
        var outra = new JwtProperties("outra-chave-secreta-com-mais-de-32-caracteres", "doapp",
                Duration.ofHours(1), Duration.ofDays(1));
        String token = new TokenService(config.jwtEncoder(outra), outra, revogados, Clock.systemUTC())
                .emitir("u1", 0, false).token();

        assertThatThrownBy(() -> decoder.decode(token)).hasMessageContaining("signature");
    }

    @Test
    void recusaTokenDeOutroEmissor() {
        var outroEmissor = new JwtProperties(JWT.segredo(), "outro-app", Duration.ofHours(1), Duration.ofDays(1));
        String token = new TokenService(config.jwtEncoder(outroEmissor), outroEmissor, revogados, Clock.systemUTC())
                .emitir("u1", 0, false).token();

        assertThatThrownBy(() -> decoder.decode(token)).isInstanceOf(JwtValidationException.class);
    }

    @Test
    void revogarGuardaOIdAteOTokenExpirarEODecoderPassaARecusar() {
        TokenService servico = servico(Instant.now());
        Jwt jwt = decoder.decode(servico.emitir("u1", 0, false).token());

        servico.revogar(jwt);

        var salvo = ArgumentCaptor.forClass(TokenRevogado.class);
        verify(revogados).save(salvo.capture());
        assertThat(salvo.getValue().getId()).isEqualTo(jwt.getId());
        assertThat(salvo.getValue().getExpiraEm()).isEqualTo(jwt.getExpiresAt());

        when(revogados.existsById(jwt.getId())).thenReturn(true);
        assertThatThrownBy(() -> decoder.decode(jwt.getTokenValue()))
                .isInstanceOf(JwtValidationException.class)
                .hasMessageContaining("logout");
    }

    @Test
    void recusaTokenDeContaQueNaoExisteMais() {
        String token = servico(Instant.now()).emitir("apagado", 0, false).token();

        assertThatThrownBy(() -> decoder.decode(token)).hasMessageContaining("não existe mais");
    }

    @Test
    void trocarASenhaEncerraOsTokensEmitidosAntesMesmoNoMesmoSegundo() {
        Instant agora = Instant.now();
        String antigo = servico(agora).emitir("u1", usuario.getVersaoSessao(), true).token();

        usuario.redefinirSenha("novo-hash", agora);

        assertThat(usuario.getVersaoSessao()).isEqualTo(1);
        assertThatThrownBy(() -> decoder.decode(antigo)).hasMessageContaining("troca de senha");
        String novo = servico(agora).emitir("u1", usuario.getVersaoSessao(), true).token();
        assertThat(decoder.decode(novo).getSubject()).isEqualTo("u1");
    }

    @Test
    void tokenSemAVersaoDaSessaoContaComoVersaoZero() {
        var semVersao = new JwtProperties(JWT.segredo(), "doapp", Duration.ofHours(1), Duration.ofDays(1));
        var encoder = config.jwtEncoder(semVersao);
        var claims = org.springframework.security.oauth2.jwt.JwtClaimsSet.builder().issuer("doapp").subject("u1")
                .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60)).id("antigo").build();
        var cabecalho = org.springframework.security.oauth2.jwt.JwsHeader
                .with(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256).build();
        String token = encoder.encode(org.springframework.security.oauth2.jwt.JwtEncoderParameters.from(cabecalho, claims))
                .getTokenValue();

        assertThat(decoder.decode(token).getSubject()).isEqualTo("u1");
        usuario.redefinirSenha("novo-hash", Instant.now());
        assertThatThrownBy(() -> decoder.decode(token)).hasMessageContaining("troca de senha");
    }

    @Test
    void tokenSemIdNaoERevogado() {
        Jwt semId = Jwt.withTokenValue("t").header("alg", "HS256").subject("u1").expiresAt(Instant.now()).build();

        servico(Instant.now()).revogar(semId);

        verify(revogados, never()).save(any());
    }
}
