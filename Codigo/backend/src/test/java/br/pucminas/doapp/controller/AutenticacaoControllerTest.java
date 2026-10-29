package br.pucminas.doapp.controller;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import br.pucminas.doapp.config.SecurityConfig;
import br.pucminas.doapp.dto.CadastroRequisicao;
import br.pucminas.doapp.dto.LoginRequisicao;
import br.pucminas.doapp.dto.SessaoResposta;
import br.pucminas.doapp.dto.UsuarioResposta;
import br.pucminas.doapp.exception.ConflitoException;
import br.pucminas.doapp.exception.NaoAutenticadoException;
import br.pucminas.doapp.model.LocalizacaoConta;
import br.pucminas.doapp.model.TipoConta;
import br.pucminas.doapp.repository.TokenRevogadoRepository;
import br.pucminas.doapp.repository.UsuarioRepository;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.service.AutenticacaoService;
import br.pucminas.doapp.service.LimiteTentativas;
import br.pucminas.doapp.service.RecuperacaoSenhaService;

@WebMvcTest(AutenticacaoController.class)
@Import({ SecurityConfig.class, LimiteTentativas.class, AutenticacaoControllerTest.Relogio.class })
class AutenticacaoControllerTest {

    @TestConfiguration
    static class Relogio {
        @Bean
        Clock relogio() {
            return Clock.systemUTC();
        }
    }

    static RequestPostProcessor ip(String endereco) {
        return requisicao -> {
            requisicao.setRemoteAddr(endereco);
            return requisicao;
        };
    }

    static final String CADASTRO_VALIDO = """
            {"tipo": "PESSOA_FISICA", "nome": "Maria da Silva", "email": "Maria@Email.com",
             "telefone": "(31) 99999-8888", "bairro": "Savassi", "cidade": "Belo Horizonte", "uf": "mg",
             "senha": "segredo123"}
            """;

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private AutenticacaoService service;

    @MockitoBean
    private RecuperacaoSenhaService recuperacao;

    @MockitoBean
    private TokenRevogadoRepository tokensRevogados;

    @MockitoBean
    private UsuarioRepository usuarios;

    static UsuarioResposta usuario() {
        return new UsuarioResposta("u1", TipoConta.PESSOA_FISICA, "Maria da Silva", "maria@email.com", "31999998888",
                new LocalizacaoConta("Savassi", "Belo Horizonte", "MG"));
    }

    static SessaoResposta sessao() {
        return new SessaoResposta("token", Instant.parse("2026-11-04T12:00:00Z"), usuario());
    }

    @Test
    void cadastroEPublicoEDevolve201ComASessao() throws Exception {
        when(service.cadastrar(any())).thenReturn(sessao());

        mvc.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON).content(CADASTRO_VALIDO))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("token"))
                .andExpect(jsonPath("$.expiraEm").value("2026-11-04T12:00:00Z"))
                .andExpect(jsonPath("$.usuario.email").value("maria@email.com"))
                .andExpect(jsonPath("$.usuario.senhaHash").doesNotExist());

        verify(service).cadastrar(argThat((CadastroRequisicao dados) ->
                dados.email().equals("maria@email.com") && dados.telefone().equals("31999998888")
                        && dados.uf().equals("MG")));
    }

    @Test
    void cadastroInvalidoDevolveOsErrosDeCadaCampo() throws Exception {
        String vazio = """
                {"nome": " ", "email": "maria@", "telefone": "9999", "bairro": "", "cidade": "B", "uf": "XX",
                 "senha": "1234567"}
                """;

        mvc.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON).content(vazio))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Confira os campos destacados e tente de novo."))
                .andExpect(jsonPath("$.campos[*].campo", containsInAnyOrder(
                        "tipo", "nome", "nome", "email", "telefone", "bairro", "bairro", "cidade", "uf", "senha")))
                .andExpect(jsonPath("$.campos[?(@.campo == 'uf')].mensagem").value("Informe o estado."))
                .andExpect(jsonPath("$.campos[?(@.campo == 'tipo')].mensagem")
                        .value("Conte se você é pessoa física ou instituição."))
                .andExpect(jsonPath("$.campos[?(@.campo == 'email')].mensagem")
                        .value("Informe um e-mail válido, como nome@email.com."))
                .andExpect(jsonPath("$.campos[?(@.campo == 'telefone')].mensagem").value("Informe o telefone com DDD."))
                .andExpect(jsonPath("$.campos[?(@.campo == 'cidade')].mensagem").value("Informe a cidade."))
                .andExpect(jsonPath("$.campos[?(@.campo == 'senha')].mensagem")
                        .value("A senha precisa ter pelo menos 8 caracteres."));
        verify(service, never()).cadastrar(any());
    }

    @Test
    void cadastroComEmailEmUsoDevolve409() throws Exception {
        when(service.cadastrar(any())).thenThrow(new ConflitoException("Já existe uma conta com este e-mail."));

        mvc.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON).content(CADASTRO_VALIDO))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensagem").value("Já existe uma conta com este e-mail."));
    }

    @Test
    void loginEPublico() throws Exception {
        when(service.entrar(any())).thenReturn(sessao());

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"maria@email.com\", \"senha\": \"segredo123\", \"manterConectado\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token"));

        verify(service).entrar(new LoginRequisicao("maria@email.com", "segredo123", true));
    }

    @Test
    void loginComSenhaErradaDevolve401ComAMensagemGenerica() throws Exception {
        when(service.entrar(any())).thenThrow(new NaoAutenticadoException("E-mail ou senha incorretos."));

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"maria@email.com\", \"senha\": \"errada123\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem").value("E-mail ou senha incorretos."));
    }

    @Test
    void depoisDeCincoSenhasErradasALoginDaContaFicaBloqueadoComOMesmoIp() throws Exception {
        when(service.entrar(any())).thenThrow(new NaoAutenticadoException("E-mail ou senha incorretos."));
        String errado = "{\"email\": \"vitima@email.com\", \"senha\": \"chute123\"}";

        for (int i = 0; i < 5; i++) {
            mvc.perform(post("/api/auth/login").with(ip("10.0.0.1")).contentType(MediaType.APPLICATION_JSON).content(errado))
                    .andExpect(status().isUnauthorized());
        }

        mvc.perform(post("/api/auth/login").with(ip("10.0.0.1")).contentType(MediaType.APPLICATION_JSON).content(errado))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.mensagem").value("Muitas tentativas de entrar. Espere 15 minutos e tente de novo."));
        verify(service, org.mockito.Mockito.times(5)).entrar(any());
        mvc.perform(post("/api/auth/login").with(ip("10.0.0.2")).contentType(MediaType.APPLICATION_JSON).content(errado))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void oMesmoIpChutandoSenhasDeVariasContasTambemEBarrado() throws Exception {
        when(service.entrar(any())).thenThrow(new NaoAutenticadoException("E-mail ou senha incorretos."));

        for (int i = 0; i < 20; i++) {
            mvc.perform(post("/api/auth/login").with(ip("10.0.1.1")).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\": \"conta" + i + "@email.com\", \"senha\": \"chute123\"}"))
                    .andExpect(status().isUnauthorized());
        }

        mvc.perform(post("/api/auth/login").with(ip("10.0.1.1")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"outra@email.com\", \"senha\": \"chute123\"}"))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void loginCertoZeraOsErrosDaConta() throws Exception {
        String errado = "{\"email\": \"maria@email.com\", \"senha\": \"errada123\"}";
        when(service.entrar(any())).thenThrow(new NaoAutenticadoException("E-mail ou senha incorretos."));
        for (int i = 0; i < 4; i++) {
            mvc.perform(post("/api/auth/login").with(ip("10.0.2.1")).contentType(MediaType.APPLICATION_JSON).content(errado));
        }
        org.mockito.Mockito.reset(service);
        when(service.entrar(any())).thenReturn(sessao());
        mvc.perform(post("/api/auth/login").with(ip("10.0.2.1")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"maria@email.com\", \"senha\": \"segredo123\"}")).andExpect(status().isOk());

        when(service.entrar(any())).thenThrow(new NaoAutenticadoException("E-mail ou senha incorretos."));
        for (int i = 0; i < 5; i++) {
            mvc.perform(post("/api/auth/login").with(ip("10.0.2.1")).contentType(MediaType.APPLICATION_JSON).content(errado))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Test
    void cadastrosDemaisDoMesmoIpSaoBarrados() throws Exception {
        when(service.cadastrar(any())).thenReturn(sessao());

        for (int i = 0; i < 10; i++) {
            mvc.perform(post("/api/auth/cadastro").with(ip("10.0.3.1")).contentType(MediaType.APPLICATION_JSON)
                    .content(CADASTRO_VALIDO)).andExpect(status().isCreated());
        }

        mvc.perform(post("/api/auth/cadastro").with(ip("10.0.3.1")).contentType(MediaType.APPLICATION_JSON)
                        .content(CADASTRO_VALIDO))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.mensagem").value("Muitos pedidos seguidos. Espere um pouco e tente de novo."));
    }

    @Test
    void pedidosDeRedefinicaoDemaisDoMesmoIpSaoBarrados() throws Exception {
        for (int i = 0; i < 10; i++) {
            mvc.perform(post("/api/auth/esqueci-senha").with(ip("10.0.4.1")).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\": \"conta" + i + "@email.com\"}")).andExpect(status().isNoContent());
        }

        mvc.perform(post("/api/auth/esqueci-senha").with(ip("10.0.4.1")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"mais@email.com\"}"))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void loginSemDadosDevolve400() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos[*].campo", containsInAnyOrder("email", "senha")));
    }

    @Test
    void euExigeLogin() throws Exception {
        mvc.perform(get("/api/auth/eu"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem").value("Entre na sua conta para continuar."));
        verify(service, never()).usuarioAtual();
    }

    @Test
    void euDevolveOsDadosDaContaLogada() throws Exception {
        when(service.usuarioAtual()).thenReturn(usuario());

        mvc.perform(get("/api/auth/eu").with(jwt().jwt(j -> j.subject("u1"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("u1"))
                .andExpect(jsonPath("$.telefone").value("31999998888"));
    }

    @Test
    void logoutExigeLogin() throws Exception {
        mvc.perform(post("/api/auth/logout")).andExpect(status().isUnauthorized());
        verify(service, never()).sair(any());
    }

    @Test
    void esqueciSenhaEPublicoESempreDevolve204() throws Exception {
        mvc.perform(post("/api/auth/esqueci-senha").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \" Maria@Email.com \"}"))
                .andExpect(status().isNoContent());

        verify(recuperacao).pedir("maria@email.com");
    }

    @Test
    void esqueciSenhaComEmailMalEscritoDevolve400() throws Exception {
        mvc.perform(post("/api/auth/esqueci-senha").contentType(MediaType.APPLICATION_JSON).content("{\"email\": \"maria@\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos[0].campo").value("email"));
        verify(recuperacao, never()).pedir(any());
    }

    @Test
    void redefinirSenhaEPublicoEDevolve204() throws Exception {
        mvc.perform(post("/api/auth/redefinir-senha").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\": \"abc\", \"senha\": \"novaSenha99\"}"))
                .andExpect(status().isNoContent());

        verify(recuperacao).redefinir("abc", "novaSenha99");
    }

    @Test
    void redefinirSenhaConfereARegraDaSenha() throws Exception {
        mvc.perform(post("/api/auth/redefinir-senha").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\": \"abc\", \"senha\": \"curta\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos[0].campo").value("senha"))
                .andExpect(jsonPath("$.campos[0].mensagem").value("A senha precisa ter pelo menos 8 caracteres."));
    }

    @Test
    void linkInvalidoDevolve400NoCampoToken() throws Exception {
        org.mockito.Mockito.doThrow(new DadosInvalidosException("token", RecuperacaoSenhaService.LINK_INVALIDO))
                .when(recuperacao).redefinir(any(), any());

        mvc.perform(post("/api/auth/redefinir-senha").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\": \"velho\", \"senha\": \"novaSenha99\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos[0].campo").value("token"))
                .andExpect(jsonPath("$.campos[0].mensagem").value("Este link não vale mais. Peça um novo."));
    }

    @Test
    void logoutRevogaOTokenUsado() throws Exception {
        mvc.perform(post("/api/auth/logout").with(jwt().jwt(j -> j.subject("u1").jti("j1"))))
                .andExpect(status().isNoContent());

        verify(service).sair(argThat(token -> "j1".equals(token.getId())));
    }
}
