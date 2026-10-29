package br.pucminas.doapp.service;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Optional;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import br.pucminas.doapp.dto.CadastroRequisicao;
import br.pucminas.doapp.dto.LoginRequisicao;
import br.pucminas.doapp.dto.SessaoResposta;
import br.pucminas.doapp.dto.UsuarioResposta;
import br.pucminas.doapp.exception.ConflitoException;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.exception.NaoAutenticadoException;
import br.pucminas.doapp.model.LocalizacaoConta;
import br.pucminas.doapp.model.Usuario;
import br.pucminas.doapp.repository.UsuarioRepository;
import br.pucminas.doapp.service.TokenService.TokenEmitido;

@Service
public class AutenticacaoService {

    static final String CREDENCIAIS_INVALIDAS = "E-mail ou senha incorretos.";
    static final String EMAIL_EM_USO = "Já existe uma conta com este e-mail.";

    private static final int SENHA_MAXIMO_BYTES = 72;

    private final UsuarioRepository usuarios;
    private final PasswordEncoder senhas;
    private final TokenService tokens;
    private final ControleAcessoService acesso;
    private final Clock relogio;
    private final String hashFalso;

    public AutenticacaoService(UsuarioRepository usuarios, PasswordEncoder senhas, TokenService tokens,
            ControleAcessoService acesso, Clock relogio) {
        this.usuarios = usuarios;
        this.senhas = senhas;
        this.tokens = tokens;
        this.acesso = acesso;
        this.relogio = relogio;
        this.hashFalso = senhas.encode("senha-que-nao-existe-em-nenhuma-conta");
    }

    public SessaoResposta cadastrar(CadastroRequisicao dados) {
        if (senhaLongaDemais(dados.senha())) {
            throw new DadosInvalidosException("senha", "Use no máximo 72 caracteres.");
        }
        if (usuarios.existsByEmail(dados.email())) {
            throw new ConflitoException(EMAIL_EM_USO);
        }
        var usuario = new Usuario(dados.tipo(), dados.nome(), dados.email(), dados.telefone(),
                new LocalizacaoConta(dados.bairro(), dados.cidade(), dados.uf()), senhas.encode(dados.senha()), relogio.instant());
        try {
            usuario = usuarios.save(usuario);
        } catch (DuplicateKeyException ex) {
            throw new ConflitoException(EMAIL_EM_USO);
        }
        return sessao(usuario, true);
    }

    public SessaoResposta entrar(LoginRequisicao dados) {
        if (senhaLongaDemais(dados.senha())) {
            throw new NaoAutenticadoException(CREDENCIAIS_INVALIDAS);
        }
        Optional<Usuario> usuario = usuarios.findByEmail(dados.email());
        boolean senhaConfere = senhas.matches(dados.senha(), usuario.map(Usuario::getSenhaHash).orElse(hashFalso));
        if (usuario.isEmpty() || !senhaConfere) {
            throw new NaoAutenticadoException(CREDENCIAIS_INVALIDAS);
        }
        return sessao(usuario.get(), dados.manterConectado());
    }

    public UsuarioResposta usuarioAtual() {
        return usuarios.findById(acesso.idUsuarioAtual())
                .map(UsuarioResposta::de)
                .orElseThrow(() -> new NaoAutenticadoException("Entre na sua conta para continuar."));
    }

    public void sair(Jwt token) {
        if (token != null) {
            tokens.revogar(token);
        }
    }

    private SessaoResposta sessao(Usuario usuario, boolean estendida) {
        TokenEmitido token = tokens.emitir(usuario.getId(), usuario.getVersaoSessao(), estendida);
        return new SessaoResposta(token.token(), token.expiraEm(), UsuarioResposta.de(usuario));
    }

    static boolean senhaLongaDemais(String senha) {
        return senha.getBytes(StandardCharsets.UTF_8).length > SENHA_MAXIMO_BYTES;
    }
}
