package br.pucminas.doapp.controller;

import java.time.Duration;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.pucminas.doapp.dto.CadastroRequisicao;
import br.pucminas.doapp.dto.LoginRequisicao;
import br.pucminas.doapp.dto.PedidoRedefinicaoRequisicao;
import br.pucminas.doapp.dto.RedefinicaoSenhaRequisicao;
import br.pucminas.doapp.dto.SessaoResposta;
import br.pucminas.doapp.dto.UsuarioResposta;
import br.pucminas.doapp.exception.NaoAutenticadoException;
import br.pucminas.doapp.service.AutenticacaoService;
import br.pucminas.doapp.service.LimiteTentativas;
import br.pucminas.doapp.service.RecuperacaoSenhaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Cadastro, login e recuperação de senha são públicos; {@code /eu} e {@code /logout} exigem login
 * (veja o {@code SecurityConfig}).
 */
@RestController
@RequestMapping("/api/auth")
public class AutenticacaoController {

    // Limites contra força bruta e abuso, por IP. No login, a conta também conta (com o IP, para que alguém
    // de fora não consiga bloquear a conta de outra pessoa errando a senha dela).
    static final int ERROS_LOGIN_POR_CONTA = 5;
    static final int ERROS_LOGIN_POR_IP = 20;
    static final Duration JANELA_LOGIN = Duration.ofMinutes(15);
    static final int PEDIDOS_POR_IP_POR_HORA = 10;
    static final Duration UMA_HORA = Duration.ofHours(1);

    static final String MUITAS_TENTATIVAS_LOGIN = "Muitas tentativas de entrar. Espere 15 minutos e tente de novo.";
    static final String MUITOS_PEDIDOS = "Muitos pedidos seguidos. Espere um pouco e tente de novo.";

    private final AutenticacaoService service;
    private final RecuperacaoSenhaService recuperacao;
    private final LimiteTentativas limite;

    public AutenticacaoController(AutenticacaoService service, RecuperacaoSenhaService recuperacao,
            LimiteTentativas limite) {
        this.service = service;
        this.recuperacao = recuperacao;
        this.limite = limite;
    }

    @PostMapping("/cadastro")
    @ResponseStatus(HttpStatus.CREATED)
    public SessaoResposta cadastrar(@Valid @RequestBody CadastroRequisicao dados, HttpServletRequest requisicao) {
        contarPedido("cadastro:" + requisicao.getRemoteAddr());
        return service.cadastrar(dados);
    }

    @PostMapping("/login")
    public SessaoResposta entrar(@Valid @RequestBody LoginRequisicao dados, HttpServletRequest requisicao) {
        String porIp = "login:" + requisicao.getRemoteAddr();
        String porConta = porIp + ":" + dados.email();
        limite.conferir(porIp, ERROS_LOGIN_POR_IP, JANELA_LOGIN, MUITAS_TENTATIVAS_LOGIN);
        limite.conferir(porConta, ERROS_LOGIN_POR_CONTA, JANELA_LOGIN, MUITAS_TENTATIVAS_LOGIN);
        try {
            SessaoResposta sessao = service.entrar(dados);
            limite.limpar(porConta);
            return sessao;
        } catch (NaoAutenticadoException ex) {
            limite.registrar(porIp, JANELA_LOGIN);
            limite.registrar(porConta, JANELA_LOGIN);
            throw ex;
        }
    }

    @GetMapping("/eu")
    public UsuarioResposta usuarioAtual() {
        return service.usuarioAtual();
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sair(@AuthenticationPrincipal Jwt token) {
        service.sair(token);
    }

    /** Sempre 204, exista ou não a conta: a resposta não revela quais e-mails têm cadastro. */
    @PostMapping("/esqueci-senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void pedirRedefinicao(@Valid @RequestBody PedidoRedefinicaoRequisicao dados, HttpServletRequest requisicao) {
        contarPedido("esqueci-senha:" + requisicao.getRemoteAddr());
        recuperacao.pedir(dados.email());
    }

    @PostMapping("/redefinir-senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void redefinirSenha(@Valid @RequestBody RedefinicaoSenhaRequisicao dados) {
        recuperacao.redefinir(dados.token(), dados.senha());
    }

    /** Barra depois de {@value #PEDIDOS_POR_IP_POR_HORA} pedidos do mesmo IP em uma hora (contas falsas, spam de e-mail). */
    private void contarPedido(String chave) {
        limite.conferir(chave, PEDIDOS_POR_IP_POR_HORA, UMA_HORA, MUITOS_PEDIDOS);
        limite.registrar(chave, UMA_HORA);
    }
}
