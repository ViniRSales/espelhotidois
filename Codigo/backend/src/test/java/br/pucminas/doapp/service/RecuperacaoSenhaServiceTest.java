package br.pucminas.doapp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import br.pucminas.doapp.config.RecuperacaoSenhaProperties;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.model.LocalizacaoConta;
import br.pucminas.doapp.model.RedefinicaoSenha;
import br.pucminas.doapp.model.TipoConta;
import br.pucminas.doapp.model.Usuario;
import br.pucminas.doapp.repository.RedefinicaoSenhaRepository;
import br.pucminas.doapp.repository.UsuarioRepository;
import br.pucminas.doapp.service.email.EnvioEmail;

class RecuperacaoSenhaServiceTest {

    static final Instant AGORA = Instant.parse("2026-10-28T12:00:00.750Z");
    static final RecuperacaoSenhaProperties CONFIG = new RecuperacaoSenhaProperties(Duration.ofMinutes(30),
            Duration.ofMinutes(2), "http://localhost:5173/", "Doapp <nao-responda@doapp.com.br>", false);

    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final RedefinicaoSenhaRepository redefinicoes = mock(RedefinicaoSenhaRepository.class);
    private final EnvioEmail email = mock(EnvioEmail.class);
    private final BCryptPasswordEncoder senhas = new BCryptPasswordEncoder(4);
    private RecuperacaoSenhaService servico;
    private Usuario maria;

    @BeforeEach
    void preparar() {
        servico = new RecuperacaoSenhaService(usuarios, redefinicoes, senhas, email, CONFIG,
                Clock.fixed(AGORA, ZoneOffset.UTC));
        maria = new Usuario(TipoConta.PESSOA_FISICA, "Maria <b>", "maria@email.com", "31999998888",
                new LocalizacaoConta("Savassi", "Belo Horizonte", "MG"), senhas.encode("senhaAntiga1"), AGORA);
        ReflectionTestUtils.setField(maria, "id", "u1");
        when(usuarios.findByEmail("maria@email.com")).thenReturn(Optional.of(maria));
        when(usuarios.findById("u1")).thenReturn(Optional.of(maria));
    }

    /** Pede o link e devolve o token que foi parar no e-mail. */
    private String pedirELerToken() {
        servico.pedir("maria@email.com");
        var texto = ArgumentCaptor.forClass(String.class);
        verify(email).enviar(eq("maria@email.com"), anyString(), texto.capture(), anyString());
        return texto.getValue().replaceAll("(?s).*token=([A-Za-z0-9_-]+).*", "$1");
    }

    @Test
    void pedidoEnviaOLinkEGuardaSoOHashDoToken() {
        String token = pedirELerToken();

        var salvo = ArgumentCaptor.forClass(RedefinicaoSenha.class);
        verify(redefinicoes).save(salvo.capture());
        assertThat(token).hasSize(43); // 32 bytes em Base64 URL, sem preenchimento
        assertThat(salvo.getValue().getTokenHash()).isEqualTo(RecuperacaoSenhaService.hash(token)).isNotEqualTo(token);
        assertThat(salvo.getValue().getUsuarioId()).isEqualTo("u1");
        assertThat(salvo.getValue().getExpiraEm()).isEqualTo(AGORA.plus(Duration.ofMinutes(30)));
    }

    @Test
    void emailTemOLinkCertoEEscapaONomeNoHtml() {
        servico.pedir("maria@email.com");

        var texto = ArgumentCaptor.forClass(String.class);
        var html = ArgumentCaptor.forClass(String.class);
        verify(email).enviar(eq("maria@email.com"), eq("Crie uma senha nova no Doapp"), texto.capture(), html.capture());
        assertThat(texto.getValue()).contains("http://localhost:5173/redefinir-senha?token=").contains("30 minutos");
        assertThat(html.getValue()).contains("Maria &lt;b&gt;").doesNotContain("Maria <b>");
    }

    @Test
    void emailSemContaNaoFazNadaENaoAvisa() {
        servico.pedir("ninguem@email.com");

        verify(redefinicoes, never()).save(any());
        verify(email, never()).enviar(any(), any(), any(), any());
    }

    @Test
    void pedidoRecenteNaoEnviaOutroEmail() {
        when(redefinicoes.existsByUsuarioIdAndCriadaEmAfter("u1", AGORA.minus(Duration.ofMinutes(2)))).thenReturn(true);

        servico.pedir("maria@email.com");

        verify(email, never()).enviar(any(), any(), any(), any());
    }

    @Test
    void tokensSaoDiferentesACadaPedido() {
        assertThat(RecuperacaoSenhaService.gerarToken()).isNotEqualTo(RecuperacaoSenhaService.gerarToken());
    }

    @Test
    void redefinirTrocaASenhaEncerraAsSessoesEApagaOsPedidos() {
        String token = pedirELerToken();
        when(redefinicoes.findByTokenHash(RecuperacaoSenhaService.hash(token))).thenReturn(Optional.of(
                new RedefinicaoSenha("u1", RecuperacaoSenhaService.hash(token), AGORA, AGORA.plusSeconds(60))));

        servico.redefinir(token, "senhaNova99");

        assertThat(senhas.matches("senhaNova99", maria.getSenhaHash())).isTrue();
        assertThat(senhas.matches("senhaAntiga1", maria.getSenhaHash())).isFalse();
        // A versão da sessão sobe: todos os tokens anteriores deixam de valer.
        assertThat(maria.getVersaoSessao()).isEqualTo(1);
        assertThat(maria.getSenhaAlteradaEm()).isEqualTo(AGORA);
        verify(redefinicoes).deleteByUsuarioId("u1");
        verify(usuarios).save(maria);
    }

    @Test
    void linkDesconhecidoEhRecusado() {
        assertThatThrownBy(() -> servico.redefinir("inventado", "senhaNova99"))
                .isInstanceOfSatisfying(DadosInvalidosException.class, ex -> {
                    assertThat(ex.getCampos()).extracting("campo").containsExactly("token");
                    assertThat(ex.getCampos()).extracting("mensagem").containsExactly("Este link não vale mais. Peça um novo.");
                });
        verify(usuarios, never()).save(any());
    }

    @Test
    void linkVencidoEhRecusadoMesmoAntesDoTtlDoMongoApagar() {
        when(redefinicoes.findByTokenHash(RecuperacaoSenhaService.hash("t")))
                .thenReturn(Optional.of(new RedefinicaoSenha("u1", "h", AGORA.minusSeconds(3600), AGORA)));

        assertThatThrownBy(() -> servico.redefinir("t", "senhaNova99")).isInstanceOf(DadosInvalidosException.class);
        verify(usuarios, never()).save(any());
    }

    @Test
    void senhaComMaisDe72BytesEhRecusada() {
        assertThatThrownBy(() -> servico.redefinir("t", "ç".repeat(40)))
                .isInstanceOfSatisfying(DadosInvalidosException.class,
                        ex -> assertThat(ex.getCampos()).extracting("campo").containsExactly("senha"));
    }
}
