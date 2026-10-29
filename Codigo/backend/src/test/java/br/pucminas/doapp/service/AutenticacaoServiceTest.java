package br.pucminas.doapp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;

import br.pucminas.doapp.dto.CadastroRequisicao;
import br.pucminas.doapp.dto.LoginRequisicao;
import br.pucminas.doapp.dto.SessaoResposta;
import br.pucminas.doapp.exception.ConflitoException;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.exception.NaoAutenticadoException;
import br.pucminas.doapp.model.LocalizacaoConta;
import br.pucminas.doapp.model.TipoConta;
import br.pucminas.doapp.model.Usuario;
import br.pucminas.doapp.repository.UsuarioRepository;
import br.pucminas.doapp.service.TokenService.TokenEmitido;

class AutenticacaoServiceTest {

    static final Instant AGORA = Instant.parse("2026-10-28T12:00:00Z");

    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final TokenService tokens = mock(TokenService.class);
    private final ControleAcessoService acesso = mock(ControleAcessoService.class);
    /** Custo baixo só para os testes ficarem rápidos. */
    private final BCryptPasswordEncoder senhas = new BCryptPasswordEncoder(4);
    private AutenticacaoService servico;

    @BeforeEach
    void preparar() {
        servico = new AutenticacaoService(usuarios, senhas, tokens, acesso, Clock.fixed(AGORA, ZoneOffset.UTC));
        when(tokens.emitir(anyString(), anyInt(), anyBoolean()))
                .thenAnswer(chamada -> new TokenEmitido("token-" + chamada.getArgument(0), AGORA.plusSeconds(60)));
        when(usuarios.save(any())).thenAnswer(chamada -> comId(chamada.getArgument(0), "u1"));
    }

    static Usuario comId(Usuario usuario, String id) {
        ReflectionTestUtils.setField(usuario, "id", id);
        return usuario;
    }

    static CadastroRequisicao cadastro() {
        return new CadastroRequisicao(TipoConta.PESSOA_FISICA, "  Maria da Silva ", " Maria@Email.COM ",
                "(31) 99999-8888", " Savassi ", "Belo Horizonte", " mg ", "segredo123");
    }

    private Usuario contaExistente(String senha) {
        return comId(new Usuario(TipoConta.PESSOA_FISICA, "Maria", "maria@email.com", "31999998888",
                new LocalizacaoConta("Savassi", "Belo Horizonte", "MG"), senhas.encode(senha), AGORA), "u1");
    }

    @Test
    void cadastroNormalizaOsDadosEGuardaSoOHashDaSenha() {
        SessaoResposta sessao = servico.cadastrar(cadastro());

        var salvo = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarios).save(salvo.capture());
        Usuario usuario = salvo.getValue();
        assertThat(usuario.getNome()).isEqualTo("Maria da Silva");
        assertThat(usuario.getEmail()).isEqualTo("maria@email.com");
        assertThat(usuario.getTelefone()).isEqualTo("31999998888");
        assertThat(usuario.getLocalizacao()).isEqualTo(new LocalizacaoConta("Savassi", "Belo Horizonte", "MG"));
        assertThat(usuario.getCriadoEm()).isEqualTo(AGORA);
        assertThat(usuario.getSenhaHash()).isNotEqualTo("segredo123").startsWith("$2");
        assertThat(senhas.matches("segredo123", usuario.getSenhaHash())).isTrue();

        assertThat(sessao.token()).isEqualTo("token-u1");
        assertThat(sessao.usuario().email()).isEqualTo("maria@email.com");
    }

    @Test
    void quemAcabouDeSeCadastrarGanhaSessaoEstendida() {
        servico.cadastrar(cadastro());

        verify(tokens).emitir("u1", 0, true);
    }

    @Test
    void emailJaCadastradoDa409() {
        when(usuarios.existsByEmail("maria@email.com")).thenReturn(true);

        assertThatThrownBy(() -> servico.cadastrar(cadastro()))
                .isInstanceOf(ConflitoException.class)
                .hasMessage("Já existe uma conta com este e-mail.");
        verify(usuarios, never()).save(any());
    }

    @Test
    void cadastroSimultaneoComOMesmoEmailDa409() {
        doThrow(new DuplicateKeyException("E11000")).when(usuarios).save(any());

        assertThatThrownBy(() -> servico.cadastrar(cadastro())).isInstanceOf(ConflitoException.class);
    }

    @Test
    void senhaComMaisDe72BytesERecusadaNoCadastro() {
        // 40 letras acentuadas = 80 bytes em UTF-8: passa no limite de caracteres, mas não no do BCrypt.
        var dados = new CadastroRequisicao(TipoConta.PESSOA_FISICA, "Maria", "maria@email.com", "31999998888",
                "Savassi", "BH", "MG", "ç".repeat(40));

        assertThatThrownBy(() -> servico.cadastrar(dados))
                .isInstanceOfSatisfying(DadosInvalidosException.class,
                        ex -> assertThat(ex.getCampos()).extracting("campo").containsExactly("senha"));
    }

    @Test
    void loginComSenhaCertaDevolveASessao() {
        when(usuarios.findByEmail("maria@email.com")).thenReturn(Optional.of(contaExistente("segredo123")));

        SessaoResposta sessao = servico.entrar(new LoginRequisicao(" MARIA@email.com", "segredo123", false));

        assertThat(sessao.token()).isEqualTo("token-u1");
        verify(tokens).emitir("u1", 0, false);
    }

    @Test
    void manterConectadoPedeSessaoEstendida() {
        when(usuarios.findByEmail("maria@email.com")).thenReturn(Optional.of(contaExistente("segredo123")));

        servico.entrar(new LoginRequisicao("maria@email.com", "segredo123", true));

        verify(tokens).emitir("u1", 0, true);
    }

    @Test
    void senhaErradaEEmailInexistenteDaoAMesmaMensagem() {
        when(usuarios.findByEmail("maria@email.com")).thenReturn(Optional.of(contaExistente("segredo123")));

        assertThatThrownBy(() -> servico.entrar(new LoginRequisicao("maria@email.com", "errada123", true)))
                .isInstanceOf(NaoAutenticadoException.class)
                .hasMessage("E-mail ou senha incorretos.");
        assertThatThrownBy(() -> servico.entrar(new LoginRequisicao("ninguem@email.com", "segredo123", true)))
                .isInstanceOf(NaoAutenticadoException.class)
                .hasMessage("E-mail ou senha incorretos.");
        verify(tokens, never()).emitir(anyString(), anyInt(), anyBoolean());
    }

    @Test
    void senhaLongaDemaisNoLoginNaoQuebraOBcrypt() {
        assertThatThrownBy(() -> servico.entrar(new LoginRequisicao("maria@email.com", "ç".repeat(40), true)))
                .isInstanceOf(NaoAutenticadoException.class);
    }

    @Test
    void usuarioAtualDevolveOsDadosDaPropriaContaSemOHash() {
        when(acesso.idUsuarioAtual()).thenReturn("u1");
        when(usuarios.findById("u1")).thenReturn(Optional.of(contaExistente("segredo123")));

        var usuario = servico.usuarioAtual();

        assertThat(usuario.id()).isEqualTo("u1");
        assertThat(usuario.email()).isEqualTo("maria@email.com");
    }

    @Test
    void tokenDeContaQueNaoExisteMaisDa401() {
        when(acesso.idUsuarioAtual()).thenReturn("apagado");
        when(usuarios.findById("apagado")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> servico.usuarioAtual()).isInstanceOf(NaoAutenticadoException.class);
    }

    @Test
    void sairRevogaOToken() {
        Jwt jwt = Jwt.withTokenValue("t").header("alg", "HS256").jti("j1").expiresAt(AGORA).build();

        servico.sair(jwt);

        verify(tokens).revogar(jwt);
    }

    @Test
    void sairSemTokenNaoFazNada() {
        servico.sair(null);

        verify(tokens, never()).revogar(any());
    }

    @Test
    void requisicoesNuncaMostramASenha() {
        assertThat(cadastro().toString()).doesNotContain("segredo123");
        assertThat(new LoginRequisicao("a@b.com", "segredo123", true).toString()).doesNotContain("segredo123");
    }
}
