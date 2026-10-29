package br.pucminas.doapp.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.pucminas.doapp.controller.CategoriaController;
import br.pucminas.doapp.controller.DoacaoController;
import br.pucminas.doapp.dto.CategoriaResposta;
import br.pucminas.doapp.model.LocalizacaoConta;
import br.pucminas.doapp.model.TipoConta;
import br.pucminas.doapp.model.Usuario;
import br.pucminas.doapp.repository.TokenRevogadoRepository;
import br.pucminas.doapp.repository.UsuarioRepository;
import br.pucminas.doapp.service.CategoriaService;
import br.pucminas.doapp.service.DoacaoService;
import br.pucminas.doapp.service.TokenService;

/** Rotas públicas e protegidas da API, com tokens de verdade (assinados com a chave do perfil dev). */
@WebMvcTest(controllers = { CategoriaController.class, DoacaoController.class })
@Import(SecurityConfig.class)
class SegurancaRotasTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JwtEncoder encoder;

    @Autowired
    private JwtDecoder decoder;

    @Autowired
    private JwtProperties jwt;

    @MockitoBean
    private CategoriaService categorias;

    @MockitoBean
    private DoacaoService doacoes;

    @MockitoBean
    private TokenRevogadoRepository revogados;

    @MockitoBean
    private UsuarioRepository usuarios;

    @BeforeEach
    void contaExiste() {
        when(usuarios.findById("u1")).thenReturn(Optional.of(new Usuario(TipoConta.PESSOA_FISICA, "Maria",
                "maria@email.com", "31999998888", new LocalizacaoConta("Savassi", "Belo Horizonte", "MG"), "hash", Instant.now())));
    }

    private String token(String usuarioId, Instant emitidoEm) {
        var tokens = new TokenService(encoder, jwt, revogados, Clock.fixed(emitidoEm, ZoneOffset.UTC));
        return tokens.emitir(usuarioId, 0, false).token();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    @Test
    void leituraDeCategoriasEPublica() throws Exception {
        when(categorias.listar()).thenReturn(List.of(new CategoriaResposta("c1", "Roupas")));

        mvc.perform(get("/api/categorias")).andExpect(status().isOk());
    }

    @Test
    void rascunhoTemDadosDoUsuarioEExigeLoginMesmoSendoGet() throws Exception {
        mvc.perform(get("/api/doacoes/rascunho"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem").value("Entre na sua conta para continuar."));
        verify(doacoes, never()).buscarRascunho();
    }

    @Test
    void escritaSemLoginDevolve401() throws Exception {
        mvc.perform(post("/api/doacoes").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/categorias")).andExpect(status().isUnauthorized());
    }

    @Test
    void tokenValidoAutenticaComOIdDoUsuarioComoNome() throws Exception {
        when(doacoes.buscarRascunho()).thenAnswer(chamada -> {
            // É este nome que o ControleAcessoService usa como id do usuário logado.
            assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("u1");
            return Optional.empty();
        });

        mvc.perform(get("/api/doacoes/rascunho").header(HttpHeaders.AUTHORIZATION, bearer(token("u1", Instant.now()))))
                .andExpect(status().isNoContent());
        verify(doacoes).buscarRascunho();
    }

    @Test
    void tokenVencidoDevolve401PedindoParaEntrarDeNovo() throws Exception {
        String vencido = token("u1", Instant.now().minus(Duration.ofDays(1)));

        mvc.perform(get("/api/doacoes/rascunho").header(HttpHeaders.AUTHORIZATION, bearer(vencido)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem").value("Sua sessão expirou. Entre de novo para continuar."));
    }

    @Test
    void tokenAdulteradoDevolve401() throws Exception {
        String valido = token("u1", Instant.now());
        // Troca a assinatura: o conteúdo continua legível, mas não foi assinado com a nossa chave.
        String adulterado = valido.substring(0, valido.lastIndexOf('.') + 1) + "assinaturaFalsa";

        mvc.perform(post("/api/doacoes").header(HttpHeaders.AUTHORIZATION, bearer(adulterado))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/doacoes/rascunho").header(HttpHeaders.AUTHORIZATION, bearer("lixo")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenEncerradoPeloLogoutDevolve401() throws Exception {
        String token = token("u1", Instant.now());
        when(revogados.existsById(decoder.decode(token).getId())).thenReturn(true);

        mvc.perform(get("/api/doacoes/rascunho").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem").value("Sua sessão expirou. Entre de novo para continuar."));
        verify(doacoes, never()).buscarRascunho();
    }

    @Test
    void healthEPublico() throws Exception {
        int status = mvc.perform(get("/actuator/health")).andReturn().getResponse().getStatus();

        assertThat(status).isNotEqualTo(401);
    }
}
