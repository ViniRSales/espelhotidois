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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

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
import br.pucminas.doapp.dto.DoacaoRascunhoRequisicao;
import br.pucminas.doapp.dto.DoacaoResposta;
import br.pucminas.doapp.dto.FotoResposta;
import br.pucminas.doapp.exception.ConflitoException;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.exception.ErroResposta.CampoInvalido;
import br.pucminas.doapp.model.Condicao;
import br.pucminas.doapp.model.FormaEntrega;
import br.pucminas.doapp.model.Localizacao;
import br.pucminas.doapp.model.SituacaoDoacao;
import br.pucminas.doapp.repository.TokenRevogadoRepository;
import br.pucminas.doapp.repository.UsuarioRepository;
import br.pucminas.doapp.service.DoacaoService;

@WebMvcTest(DoacaoController.class)
@Import(SecurityConfig.class)
class DoacaoControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private DoacaoService service;

    @MockitoBean
    private TokenRevogadoRepository tokensRevogados;

    @MockitoBean
    private UsuarioRepository usuarios;

    @Test
    @WithMockUser
    void semRascunhoDevolve204() throws Exception {
        when(service.buscarRascunho()).thenReturn(Optional.empty());

        mvc.perform(get("/api/doacoes/rascunho")).andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser
    void criarRascunhoDevolve201ComLocation() throws Exception {
        when(service.criarRascunho(any())).thenReturn(resposta("d1"));

        mvc.perform(post("/api/doacoes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"titulo": "Cachecol vermelho", "tags": ["inverno"],
                                 "formasEntrega": ["A_COMBINAR"], "validade": "2026-11-10",
                                 "localizacao": {"bairro": "Ipiranga", "cidade": "Belo Horizonte"}}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/doacoes/d1"))
                .andExpect(jsonPath("$.id").value("d1"))
                .andExpect(jsonPath("$.categoria.nome").value("Roupas"))
                .andExpect(jsonPath("$.fotos[0].url").value("/api/fotos/d1/f1.jpg"))
                .andExpect(jsonPath("$.formasEntrega[0]").value("A_COMBINAR"))
                .andExpect(jsonPath("$.dataCadastro").value("2026-10-27T15:00:00Z"))
                .andExpect(jsonPath("$.doadorId").doesNotExist());

        verify(service).criarRascunho(new DoacaoRascunhoRequisicao("Cachecol vermelho", null, null, null,
                List.of("inverno"), null, Set.of(FormaEntrega.A_COMBINAR),
                LocalDate.parse("2026-11-10"), null, new Localizacao("Ipiranga", "Belo Horizonte")));
    }

    @Test
    @WithMockUser
    void dadosInvalidosDevolvem400ComOsCampos() throws Exception {
        when(service.atualizarRascunho(eq("d1"), any()))
                .thenThrow(new DadosInvalidosException(List.of(new CampoInvalido("titulo", "O nome pode ter até 90 caracteres."))));

        mvc.perform(put("/api/doacoes/d1").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos[0].campo").value("titulo"))
                .andExpect(jsonPath("$.campos[0].mensagem").value("O nome pode ter até 90 caracteres."));
    }

    @Test
    @WithMockUser
    void valorDeOpcaoInexistenteDevolve400() throws Exception {
        mvc.perform(put("/api/doacoes/d1").contentType(MediaType.APPLICATION_JSON).content("{\"condicao\": \"QUEBRADO\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void conflitoDevolve409() throws Exception {
        when(service.publicar("d1")).thenThrow(new ConflitoException("Esta doação já foi publicada e não pode mais ser alterada."));

        mvc.perform(post("/api/doacoes/d1/publicar"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensagem").value("Esta doação já foi publicada e não pode mais ser alterada."));
    }

    @Test
    @WithMockUser
    void enviaFotoComoMultipart() throws Exception {
        var arquivo = new MockMultipartFile("arquivo", "a.jpg", "image/jpeg", new byte[] { 1, 2 });
        when(service.adicionarFoto(eq("d1"), any())).thenReturn(new FotoResposta("f1", "/api/fotos/d1/f1.jpg", "image/jpeg", 2));

        mvc.perform(multipart("/api/doacoes/d1/fotos").file(arquivo))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.url").value("/api/fotos/d1/f1.jpg"));
    }

    @Test
    @WithMockUser
    void descartarERemoverFotoDevolvem204() throws Exception {
        mvc.perform(delete("/api/doacoes/d1")).andExpect(status().isNoContent());
        mvc.perform(delete("/api/doacoes/d1/fotos/f1")).andExpect(status().isNoContent());

        verify(service).descartarRascunho("d1");
        verify(service).removerFoto("d1", "f1");
    }

    @Test
    void escritaSemLoginDevolve401() throws Exception {
        mvc.perform(post("/api/doacoes").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    private static DoacaoResposta resposta(String id) {
        Instant agora = Instant.parse("2026-10-27T15:00:00Z");
        return new DoacaoResposta(id, "Cachecol vermelho", null,
                List.of(new FotoResposta("f1", "/api/fotos/" + id + "/f1.jpg", "image/jpeg", 100)),
                new CategoriaResposta("cat-roupas", "Roupas"), List.of("inverno"), Condicao.EXCELENTE,
                List.of(FormaEntrega.A_COMBINAR), null, null, new Localizacao("Ipiranga", "Belo Horizonte"),
                SituacaoDoacao.RASCUNHO, agora, agora, null, null);
    }
}
