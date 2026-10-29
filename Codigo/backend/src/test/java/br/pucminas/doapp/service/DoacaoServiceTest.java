package br.pucminas.doapp.service;

import static br.pucminas.doapp.service.DoacaoFixtures.AGORA;
import static br.pucminas.doapp.service.DoacaoFixtures.PROPRIEDADES;
import static br.pucminas.doapp.service.DoacaoFixtures.RELOGIO;
import static br.pucminas.doapp.service.DoacaoFixtures.ROUPAS;
import static br.pucminas.doapp.service.DoacaoFixtures.foto;
import static br.pucminas.doapp.service.DoacaoFixtures.rascunho;
import static br.pucminas.doapp.service.DoacaoFixtures.rascunhoCompleto;
import static br.pucminas.doapp.service.DoacaoFixtures.requisicao;
import static br.pucminas.doapp.service.DoacaoFixtures.vazia;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import br.pucminas.doapp.exception.AcessoNegadoException;
import br.pucminas.doapp.exception.ConflitoException;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.exception.RecursoNaoEncontradoException;
import br.pucminas.doapp.model.Doacao;
import br.pucminas.doapp.model.SituacaoDoacao;
import br.pucminas.doapp.repository.DoacaoRepository;
import br.pucminas.doapp.service.fotos.ArmazenamentoFotos;

@ExtendWith(MockitoExtension.class)
class DoacaoServiceTest {

    private static final String DONO = "usuario-1";

    @Mock
    private DoacaoRepository repository;

    @Mock
    private CategoriaService categorias;

    @Mock
    private ArmazenamentoFotos armazenamento;

    @Mock
    private ControleAcessoService acesso;

    private DoacaoService service;

    @BeforeEach
    void criarServico() {
        var regras = new RegrasDoacao(PROPRIEDADES, categorias, RELOGIO);
        service = new DoacaoService(repository, regras, categorias, armazenamento, acesso, PROPRIEDADES, RELOGIO);
        lenient().when(acesso.idUsuarioAtual()).thenReturn(DONO);
        lenient().when(categorias.procurar(any())).thenReturn(Optional.empty());
        lenient().when(categorias.procurar(ROUPAS.getId())).thenReturn(Optional.of(ROUPAS));
        lenient().when(repository.save(any())).thenAnswer(chamada -> chamada.getArgument(0));
    }

    @Test
    void criaRascunhoDoUsuarioLogado() {
        when(repository.findFirstByDoadorIdAndSituacao(DONO, SituacaoDoacao.RASCUNHO)).thenReturn(Optional.empty());

        var criada = service.criarRascunho(requisicao("Cachecol", ROUPAS.getId(), List.of("Inverno")));

        assertThat(criada.situacao()).isEqualTo(SituacaoDoacao.RASCUNHO);
        assertThat(criada.titulo()).isEqualTo("Cachecol");
        assertThat(criada.categoria().nome()).isEqualTo("Roupas");
        assertThat(criada.tags()).containsExactly("inverno");
        assertThat(criada.dataCadastro()).isEqualTo(AGORA);
    }

    @Test
    void naoCriaSegundoRascunho() {
        when(repository.findFirstByDoadorIdAndSituacao(DONO, SituacaoDoacao.RASCUNHO))
                .thenReturn(Optional.of(rascunho("d1", DONO)));

        assertThatThrownBy(() -> service.criarRascunho(vazia())).isInstanceOf(ConflitoException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void buscaORascunhoDoUsuario() {
        when(repository.findFirstByDoadorIdAndSituacao(DONO, SituacaoDoacao.RASCUNHO))
                .thenReturn(Optional.of(rascunho("d1", DONO)));

        assertThat(service.buscarRascunho()).get().extracting("id").isEqualTo("d1");
    }

    @Test
    void atualizaRascunho() {
        when(repository.findById("d1")).thenReturn(Optional.of(rascunho("d1", DONO)));

        var atualizada = service.atualizarRascunho("d1", requisicao("Casaco", null, null));

        assertThat(atualizada.titulo()).isEqualTo("Casaco");
    }

    @Test
    void soODonoAlteraORascunho() {
        when(repository.findById("d1")).thenReturn(Optional.of(rascunho("d1", "outra-pessoa")));
        doThrow(new AcessoNegadoException("Só quem criou este item pode alterá-lo."))
                .when(acesso).garantirDono("outra-pessoa");

        assertThatThrownBy(() -> service.atualizarRascunho("d1", vazia())).isInstanceOf(AcessoNegadoException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void doacaoPublicadaNaoEhMaisAlteradaComoRascunho() {
        Doacao publicada = rascunhoCompleto("d1", DONO);
        publicada.publicar(AGORA, Duration.ofDays(30));
        when(repository.findById("d1")).thenReturn(Optional.of(publicada));

        assertThatThrownBy(() -> service.atualizarRascunho("d1", vazia())).isInstanceOf(ConflitoException.class);
        assertThatThrownBy(() -> service.publicar("d1")).isInstanceOf(ConflitoException.class);
    }

    @Test
    void doacaoInexistenteDa404() {
        when(repository.findById("x")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.atualizarRascunho("x", vazia())).isInstanceOf(RecursoNaoEncontradoException.class);
    }

    @Test
    void descartarApagaRascunhoEFotos() {
        Doacao doacao = rascunho("d1", DONO);
        when(repository.findById("d1")).thenReturn(Optional.of(doacao));

        service.descartarRascunho("d1");

        verify(repository).delete(doacao);
        verify(armazenamento).removerTodas("d1");
    }

    @Test
    void adicionaFoto() {
        var arquivo = new MockMultipartFile("arquivo", "a.jpg", "image/jpeg", new byte[] { 1 });
        Doacao doacao = rascunho("d1", DONO);
        when(repository.findById("d1")).thenReturn(Optional.of(doacao));
        when(armazenamento.salvar("d1", arquivo)).thenReturn(foto("f1"));

        var resposta = service.adicionarFoto("d1", arquivo);

        assertThat(resposta.url()).isEqualTo("/api/fotos/d1/f1.jpg");
        assertThat(doacao.getFotos()).extracting("id").containsExactly("f1");
    }

    @Test
    void naoPassaDoMaximoDeFotos() {
        Doacao doacao = rascunho("d1", DONO);
        for (int i = 0; i < 10; i++) {
            doacao.adicionarFoto(foto("f" + i));
        }
        when(repository.findById("d1")).thenReturn(Optional.of(doacao));

        assertThatThrownBy(() -> service.adicionarFoto("d1", new MockMultipartFile("arquivo", new byte[] { 1 })))
                .isInstanceOf(DadosInvalidosException.class);
        verify(armazenamento, never()).salvar(any(), any());
    }

    @Test
    void fotoGravadaEhApagadaSeORascunhoNaoForSalvo() {
        var arquivo = new MockMultipartFile("arquivo", new byte[] { 1 });
        when(repository.findById("d1")).thenReturn(Optional.of(rascunho("d1", DONO)));
        when(armazenamento.salvar("d1", arquivo)).thenReturn(foto("f1"));
        when(repository.save(any())).thenThrow(new IllegalStateException("banco fora do ar"));

        assertThatThrownBy(() -> service.adicionarFoto("d1", arquivo)).isInstanceOf(IllegalStateException.class);
        verify(armazenamento).remover("d1", "f1.jpg");
    }

    @Test
    void removeFoto() {
        Doacao doacao = rascunho("d1", DONO);
        doacao.adicionarFoto(foto("f1"));
        when(repository.findById("d1")).thenReturn(Optional.of(doacao));

        service.removerFoto("d1", "f1");

        assertThat(doacao.getFotos()).isEmpty();
        verify(armazenamento).remover("d1", "f1.jpg");
    }

    @Test
    void removerFotoInexistenteDa404() {
        when(repository.findById("d1")).thenReturn(Optional.of(rascunho("d1", DONO)));

        assertThatThrownBy(() -> service.removerFoto("d1", "x")).isInstanceOf(RecursoNaoEncontradoException.class);
        verify(armazenamento, never()).remover(any(), any());
    }

    @Test
    void publicaComPrazoDeTrintaDias() {
        when(repository.findById("d1")).thenReturn(Optional.of(rascunhoCompleto("d1", DONO)));

        var publicada = service.publicar("d1");

        assertThat(publicada.situacao()).isEqualTo(SituacaoDoacao.DISPONIVEL);
        assertThat(publicada.publicadaEm()).isEqualTo(AGORA);
        assertThat(publicada.expiraEm()).isEqualTo(AGORA.plus(Duration.ofDays(30)));
    }

    @Test
    void naoPublicaRascunhoIncompleto() {
        when(repository.findById("d1")).thenReturn(Optional.of(rascunho("d1", DONO)));

        assertThatThrownBy(() -> service.publicar("d1")).isInstanceOf(DadosInvalidosException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void doacaoPublicadaEhVistaPorQualquerUm() {
        Doacao publicada = rascunhoCompleto("d1", "outra-pessoa");
        publicada.publicar(AGORA, Duration.ofDays(30));
        when(repository.findById("d1")).thenReturn(Optional.of(publicada));

        assertThat(service.buscar("d1").id()).isEqualTo("d1");
        verify(acesso, never()).ehDono(any());
    }

    @Test
    void rascunhoDeOutraPessoaNaoExisteParaQuemBusca() {
        when(repository.findById("d1")).thenReturn(Optional.of(rascunho("d1", "outra-pessoa")));
        when(acesso.ehDono("outra-pessoa")).thenReturn(false);

        assertThatThrownBy(() -> service.buscar("d1")).isInstanceOf(RecursoNaoEncontradoException.class);
    }
}
