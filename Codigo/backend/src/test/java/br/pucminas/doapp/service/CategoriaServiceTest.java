package br.pucminas.doapp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import br.pucminas.doapp.exception.RecursoNaoEncontradoException;
import br.pucminas.doapp.model.Categoria;
import br.pucminas.doapp.repository.CategoriaRepository;

@ExtendWith(MockitoExtension.class)
class CategoriaServiceTest {

    @Mock
    private CategoriaRepository repository;

    @InjectMocks
    private CategoriaService service;

    @Test
    void listaCategoriasEmOrdemAlfabetica() {
        when(repository.findAllByOrderByNomeAsc()).thenReturn(List.of(new Categoria("Móveis"), new Categoria("Roupas")));

        var categorias = service.listar();

        assertThat(categorias).extracting("nome").containsExactly("Móveis", "Roupas");
    }

    @Test
    @SuppressWarnings("unchecked")
    void cargaInicialCriaSoAsCategoriasQueFaltam() {
        when(repository.existsByNome(anyString())).thenReturn(false);
        when(repository.existsByNome("Roupas")).thenReturn(true);

        int criadas = service.criarCategoriasIniciais();

        ArgumentCaptor<List<Categoria>> salvas = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(salvas.capture());
        assertThat(criadas).isEqualTo(CategoriaService.CATEGORIAS_INICIAIS.size() - 1);
        assertThat(salvas.getValue()).extracting("nome").doesNotContain("Roupas");
    }

    @Test
    void cargaInicialNaoCriaNadaQuandoTudoJaExiste() {
        when(repository.existsByNome(anyString())).thenReturn(true);

        assertThat(service.criarCategoriasIniciais()).isZero();
    }

    @Test
    void buscarCategoriaInexistenteLanca404() {
        when(repository.findById("x")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.buscar("x")).isInstanceOf(RecursoNaoEncontradoException.class);
    }
}
