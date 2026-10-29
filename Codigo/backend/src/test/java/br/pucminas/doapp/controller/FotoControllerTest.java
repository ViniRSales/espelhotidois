package br.pucminas.doapp.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.pucminas.doapp.config.SecurityConfig;
import br.pucminas.doapp.exception.RecursoNaoEncontradoException;
import br.pucminas.doapp.repository.TokenRevogadoRepository;
import br.pucminas.doapp.repository.UsuarioRepository;
import br.pucminas.doapp.service.fotos.ArmazenamentoFotos;

@WebMvcTest(FotoController.class)
@Import(SecurityConfig.class)
class FotoControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private ArmazenamentoFotos armazenamento;

    /** Usado pelo JwtDecoder do SecurityConfig para recusar tokens encerrados pelo logout. */
    @MockitoBean
    private TokenRevogadoRepository tokensRevogados;

    /** Usado pelo JwtDecoder para conferir se a sessão do token ainda vale. */
    @MockitoBean
    private UsuarioRepository usuarios;

    @Test
    void fotoEhPublicaComTipoECache() throws Exception {
        byte[] conteudo = { 'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P' };
        when(armazenamento.carregar("doacao-1", "abc.webp")).thenReturn(new ByteArrayResource(conteudo));

        mvc.perform(get("/api/fotos/doacao-1/abc.webp"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/webp"))
                .andExpect(content().bytes(conteudo))
                .andExpect(header().string("Cache-Control", "max-age=31536000, public, immutable"));
    }

    @Test
    void fotoInexistenteDevolve404NoFormatoPadrao() throws Exception {
        when(armazenamento.carregar("doacao-1", "x.jpg")).thenThrow(new RecursoNaoEncontradoException("Foto não encontrada."));

        mvc.perform(get("/api/fotos/doacao-1/x.jpg"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensagem").value("Foto não encontrada."));
    }

    @Test
    @WithMockUser
    void metodoNaoSuportadoDevolve405NoFormatoPadrao() throws Exception {
        mvc.perform(post("/api/fotos/doacao-1/x.jpg"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405));
    }
}
