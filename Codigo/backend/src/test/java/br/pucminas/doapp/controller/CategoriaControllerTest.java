package br.pucminas.doapp.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.pucminas.doapp.config.SecurityConfig;
import br.pucminas.doapp.dto.CategoriaResposta;
import br.pucminas.doapp.repository.TokenRevogadoRepository;
import br.pucminas.doapp.repository.UsuarioRepository;
import br.pucminas.doapp.service.CategoriaService;

@WebMvcTest(CategoriaController.class)
@Import(SecurityConfig.class)
class CategoriaControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private CategoriaService service;

    @MockitoBean
    private TokenRevogadoRepository tokensRevogados;

    @MockitoBean
    private UsuarioRepository usuarios;

    @Test
    void listagemDeCategoriasEhPublica() throws Exception {
        when(service.listar()).thenReturn(List.of(new CategoriaResposta("1", "Roupas")));

        mvc.perform(get("/api/categorias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nome").value("Roupas"));
    }

    @Test
    void escritaSemLoginDevolve401NoFormatoPadrao() throws Exception {
        mvc.perform(post("/api/categorias"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.mensagem").value("Entre na sua conta para continuar."));
    }

    @Test
    void rotaInexistenteDevolve404NoFormatoPadrao() throws Exception {
        mvc.perform(get("/api/nao-existe"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
