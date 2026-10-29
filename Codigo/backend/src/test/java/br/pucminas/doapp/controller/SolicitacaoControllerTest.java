package br.pucminas.doapp.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.pucminas.doapp.config.SecurityConfig;
import br.pucminas.doapp.dto.CategoriaResposta;
import br.pucminas.doapp.dto.FotoResposta;
import br.pucminas.doapp.dto.SolicitacaoRequisicao;
import br.pucminas.doapp.dto.SolicitacaoResposta;
import br.pucminas.doapp.exception.AcessoNegadoException;
import br.pucminas.doapp.exception.ConflitoException;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.exception.ErroResposta.CampoInvalido;
import br.pucminas.doapp.model.Localizacao;
import br.pucminas.doapp.model.SituacaoSolicitacao;
import br.pucminas.doapp.model.Urgencia;
import br.pucminas.doapp.repository.TokenRevogadoRepository;
import br.pucminas.doapp.repository.UsuarioRepository;
import br.pucminas.doapp.service.SolicitacaoService;

@WebMvcTest(SolicitacaoController.class)
@Import(SecurityConfig.class)
class SolicitacaoControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private SolicitacaoService service;

    /** Usado pelo JwtDecoder do SecurityConfig para recusar tokens encerrados pelo logout. */
    @MockitoBean
    private TokenRevogadoRepository tokensRevogados;

    /** Usado pelo JwtDecoder para conferir se a sessão do token ainda vale. */
    @MockitoBean
    private UsuarioRepository usuarios;

    @Test
    @WithMockUser
    void cadastrarDevolve201ComLocation() throws Exception {
        when(service.cadastrar(any())).thenReturn(resposta("s1", SituacaoSolicitacao.ABERTA));

        mvc.perform(post("/api/solicitacoes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"titulo": "Roupas de frio para crianças", "categoriaId": "cat-roupas",
                                 "urgencia": "ALTA", "localizacao": {"bairro": "Ipiranga", "cidade": "Belo Horizonte"}}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/solicitacoes/s1"))
                .andExpect(jsonPath("$.id").value("s1"))
                .andExpect(jsonPath("$.urgencia").value("ALTA"))
                .andExpect(jsonPath("$.categoria.nome").value("Roupas"))
                .andExpect(jsonPath("$.souDono").value(true));

        verify(service).cadastrar(new SolicitacaoRequisicao("Roupas de frio para crianças", null, "cat-roupas",
                Urgencia.ALTA, new Localizacao("Ipiranga", "Belo Horizonte")));
    }

    @Test
    void qualquerPessoaVeOPedidoSemDadosDeQuemPediu() throws Exception {
        when(service.buscar("s1")).thenReturn(resposta("s1", SituacaoSolicitacao.ABERTA));

        mvc.perform(get("/api/solicitacoes/s1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Roupas de frio para crianças"))
                .andExpect(jsonPath("$.receptorId").doesNotExist())
                .andExpect(jsonPath("$.telefone").doesNotExist())
                .andExpect(jsonPath("$.email").doesNotExist());
    }

    @Test
    @WithMockUser
    void dadosInvalidosDevolvem400ComOsCampos() throws Exception {
        when(service.editar(eq("s1"), any())).thenThrow(new DadosInvalidosException(
                List.of(new CampoInvalido("urgencia", "Escolha para quando você precisa."))));

        mvc.perform(put("/api/solicitacoes/s1").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos[0].campo").value("urgencia"))
                .andExpect(jsonPath("$.campos[0].mensagem").value("Escolha para quando você precisa."));
    }

    @Test
    @WithMockUser
    void urgenciaInexistenteDevolve400() throws Exception {
        mvc.perform(post("/api/solicitacoes").contentType(MediaType.APPLICATION_JSON).content("{\"urgencia\": \"AGORA\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void cancelarDevolveOPedidoCancelado() throws Exception {
        when(service.cancelar("s1")).thenReturn(resposta("s1", SituacaoSolicitacao.CANCELADA));

        mvc.perform(post("/api/solicitacoes/s1/cancelar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.situacao").value("CANCELADA"));
    }

    @Test
    @WithMockUser
    void outraPessoaRecebe403() throws Exception {
        when(service.cancelar("s1")).thenThrow(new AcessoNegadoException("Só quem criou este item pode alterá-lo."));

        mvc.perform(post("/api/solicitacoes/s1/cancelar")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser
    void pedidoEncerradoDevolve409() throws Exception {
        when(service.cancelar("s1"))
                .thenThrow(new ConflitoException("Este pedido já foi encerrado e não pode mais ser alterado."));

        mvc.perform(post("/api/solicitacoes/s1/cancelar"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensagem").value("Este pedido já foi encerrado e não pode mais ser alterado."));
    }

    @Test
    @WithMockUser
    void enviaFotoDeReferenciaComoMultipart() throws Exception {
        var arquivo = new MockMultipartFile("arquivo", "casaco.jpg", "image/jpeg", new byte[] { 1, 2 });
        when(service.adicionarFoto(eq("s1"), any()))
                .thenReturn(new FotoResposta("f1", "/api/fotos/s1/f1.jpg", "image/jpeg", 2));

        mvc.perform(multipart("/api/solicitacoes/s1/fotos").file(arquivo))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.url").value("/api/fotos/s1/f1.jpg"));
    }

    @Test
    @WithMockUser
    void removerFotoDevolve204() throws Exception {
        mvc.perform(delete("/api/solicitacoes/s1/fotos/f1")).andExpect(status().isNoContent());

        verify(service).removerFoto("s1", "f1");
    }

    @Test
    void respostaTrazAFotoDeReferencia() throws Exception {
        when(service.buscar("s1")).thenReturn(resposta("s1", SituacaoSolicitacao.ABERTA));

        mvc.perform(get("/api/solicitacoes/s1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fotos[0].url").value("/api/fotos/s1/f1.jpg"));
    }

    @Test
    void escritaSemLoginDevolve401() throws Exception {
        mvc.perform(post("/api/solicitacoes").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/solicitacoes/s1/cancelar")).andExpect(status().isUnauthorized());
    }

    private static SolicitacaoResposta resposta(String id, SituacaoSolicitacao situacao) {
        Instant agora = Instant.parse("2026-10-28T15:00:00Z");
        return new SolicitacaoResposta(id, "Roupas de frio para crianças", null,
                new CategoriaResposta("cat-roupas", "Roupas"), Urgencia.ALTA,
                new Localizacao("Ipiranga", "Belo Horizonte"),
                List.of(new FotoResposta("f1", "/api/fotos/" + id + "/f1.jpg", "image/jpeg", 100)),
                situacao, agora, agora, true);
    }
}
