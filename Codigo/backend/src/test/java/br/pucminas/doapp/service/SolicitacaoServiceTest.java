package br.pucminas.doapp.service;

import static br.pucminas.doapp.service.SolicitacaoFixtures.AGORA;
import static br.pucminas.doapp.service.SolicitacaoFixtures.PROPRIEDADES;
import static br.pucminas.doapp.service.SolicitacaoFixtures.RELOGIO;
import static br.pucminas.doapp.service.SolicitacaoFixtures.ROUPAS;
import static br.pucminas.doapp.service.SolicitacaoFixtures.requisicao;
import static br.pucminas.doapp.service.SolicitacaoFixtures.solicitacao;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import br.pucminas.doapp.dto.SolicitacaoRequisicao;
import br.pucminas.doapp.exception.AcessoNegadoException;
import br.pucminas.doapp.exception.ConflitoException;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.exception.NaoAutenticadoException;
import br.pucminas.doapp.exception.RecursoNaoEncontradoException;
import br.pucminas.doapp.model.Foto;
import br.pucminas.doapp.model.Localizacao;
import br.pucminas.doapp.model.SituacaoSolicitacao;
import br.pucminas.doapp.model.Solicitacao;
import br.pucminas.doapp.model.Urgencia;
import br.pucminas.doapp.repository.SolicitacaoRepository;
import br.pucminas.doapp.service.fotos.ArmazenamentoFotos;

@ExtendWith(MockitoExtension.class)
class SolicitacaoServiceTest {

    private static final String DONO = "usuario-1";
    private static final String OUTRA_PESSOA = "usuario-2";

    @Mock
    private SolicitacaoRepository repository;

    @Mock
    private CategoriaService categorias;

    @Mock
    private ArmazenamentoFotos armazenamento;

    @Mock
    private ControleAcessoService acesso;

    private SolicitacaoService service;

    @BeforeEach
    void criarServico() {
        var regras = new RegrasSolicitacao(PROPRIEDADES, categorias);
        service = new SolicitacaoService(repository, regras, categorias, armazenamento, acesso, PROPRIEDADES, RELOGIO);
        lenient().when(acesso.idUsuarioAtual()).thenReturn(DONO);
        lenient().when(acesso.ehDono(DONO)).thenReturn(true);
        lenient().when(categorias.procurar(any())).thenReturn(Optional.empty());
        lenient().when(categorias.procurar(ROUPAS.getId())).thenReturn(Optional.of(ROUPAS));
        lenient().when(repository.save(any())).thenAnswer(chamada -> chamada.getArgument(0));
    }

    @Test
    void cadastraPedidoAbertoDoUsuarioLogado() {
        var criada = service.cadastrar(requisicao());

        assertThat(criada.situacao()).isEqualTo(SituacaoSolicitacao.ABERTA);
        assertThat(criada.titulo()).isEqualTo("Roupas de frio para crianças");
        assertThat(criada.categoria().nome()).isEqualTo("Roupas");
        assertThat(criada.urgencia()).isEqualTo(Urgencia.ALTA);
        assertThat(criada.dataCadastro()).isEqualTo(AGORA);
        assertThat(criada.souDono()).isTrue();
        verify(repository).save(any(Solicitacao.class));
    }

    @Test
    void naoCadastraSemLogin() {
        when(acesso.idUsuarioAtual()).thenThrow(new NaoAutenticadoException("Entre na sua conta para continuar."));

        assertThatThrownBy(() -> service.cadastrar(requisicao())).isInstanceOf(NaoAutenticadoException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void naoCadastraComCamposObrigatoriosVazios() {
        var vazia = new SolicitacaoRequisicao(null, null, null, null, null);

        assertThatThrownBy(() -> service.cadastrar(vazia)).isInstanceOf(DadosInvalidosException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void qualquerPessoaVeOPedidoSemSerDona() {
        when(repository.findById("s1")).thenReturn(Optional.of(solicitacao("s1", DONO)));
        when(acesso.ehDono(DONO)).thenThrow(new NaoAutenticadoException("Entre na sua conta para continuar."));

        var vista = service.buscar("s1");

        assertThat(vista.titulo()).isEqualTo("Roupas de frio para crianças");
        assertThat(vista.souDono()).isFalse();
    }

    @Test
    void pedidoInexistenteDevolve404() {
        when(repository.findById("nao-existe")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.buscar("nao-existe")).isInstanceOf(RecursoNaoEncontradoException.class);
    }

    @Test
    void donoEditaOPedido() {
        when(repository.findById("s1")).thenReturn(Optional.of(solicitacao("s1", DONO)));
        var dados = new SolicitacaoRequisicao("Casaco infantil tamanho 8", "Para meu filho.", ROUPAS.getId(),
                Urgencia.MEDIA, new Localizacao("Ipiranga", "Belo Horizonte"));

        var editada = service.editar("s1", dados);

        assertThat(editada.titulo()).isEqualTo("Casaco infantil tamanho 8");
        assertThat(editada.urgencia()).isEqualTo(Urgencia.MEDIA);
        assertThat(editada.localizacao()).isEqualTo(new Localizacao("Ipiranga", "Belo Horizonte"));
        verify(acesso).garantirDono(DONO);
    }

    @Test
    void outraPessoaNaoEdita() {
        when(repository.findById("s1")).thenReturn(Optional.of(solicitacao("s1", OUTRA_PESSOA)));
        doThrow(new AcessoNegadoException("Só quem criou este item pode alterá-lo."))
                .when(acesso).garantirDono(OUTRA_PESSOA);

        assertThatThrownBy(() -> service.editar("s1", requisicao())).isInstanceOf(AcessoNegadoException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void donoCancelaOPedido() {
        when(repository.findById("s1")).thenReturn(Optional.of(solicitacao("s1", DONO)));

        var cancelada = service.cancelar("s1");

        assertThat(cancelada.situacao()).isEqualTo(SituacaoSolicitacao.CANCELADA);
        verify(acesso).garantirDono(DONO);
    }

    @Test
    void outraPessoaNaoCancela() {
        when(repository.findById("s1")).thenReturn(Optional.of(solicitacao("s1", OUTRA_PESSOA)));
        doThrow(new AcessoNegadoException("Só quem criou este item pode alterá-lo."))
                .when(acesso).garantirDono(OUTRA_PESSOA);

        assertThatThrownBy(() -> service.cancelar("s1")).isInstanceOf(AcessoNegadoException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void pedidoCanceladoNaoPodeSerAlterado() {
        Solicitacao cancelada = solicitacao("s1", DONO);
        cancelada.cancelar(AGORA);
        when(repository.findById("s1")).thenReturn(Optional.of(cancelada));

        assertThatThrownBy(() -> service.editar("s1", requisicao())).isInstanceOf(ConflitoException.class);
        assertThatThrownBy(() -> service.cancelar("s1")).isInstanceOf(ConflitoException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void donoAdicionaFotoDeReferencia() {
        when(repository.findById("s1")).thenReturn(Optional.of(solicitacao("s1", DONO)));
        var arquivo = new MockMultipartFile("arquivo", "casaco.jpg", "image/jpeg", new byte[] { 1, 2 });
        when(armazenamento.salvar("s1", arquivo)).thenReturn(new Foto("f1", "f1.jpg", "image/jpeg", 2));

        var foto = service.adicionarFoto("s1", arquivo);

        assertThat(foto.url()).isEqualTo("/api/fotos/s1/f1.jpg");
        verify(acesso).garantirDono(DONO);
        verify(repository).save(any(Solicitacao.class));
    }

    @Test
    void naoPassaDoLimiteDeFotos() {
        Solicitacao comFoto = solicitacao("s1", DONO);
        comFoto.adicionarFoto(new Foto("f1", "f1.jpg", "image/jpeg", 2));
        when(repository.findById("s1")).thenReturn(Optional.of(comFoto));
        var arquivo = new MockMultipartFile("arquivo", "outra.jpg", "image/jpeg", new byte[] { 1 });

        assertThatThrownBy(() -> service.adicionarFoto("s1", arquivo)).isInstanceOf(DadosInvalidosException.class);
        verify(armazenamento, never()).salvar(any(), any());
    }

    @Test
    void apagaOArquivoSeNaoConseguirGravarNoBanco() {
        when(repository.findById("s1")).thenReturn(Optional.of(solicitacao("s1", DONO)));
        var arquivo = new MockMultipartFile("arquivo", "casaco.jpg", "image/jpeg", new byte[] { 1 });
        when(armazenamento.salvar("s1", arquivo)).thenReturn(new Foto("f1", "f1.jpg", "image/jpeg", 1));
        when(repository.save(any())).thenThrow(new IllegalStateException("banco fora do ar"));

        assertThatThrownBy(() -> service.adicionarFoto("s1", arquivo)).isInstanceOf(IllegalStateException.class);
        verify(armazenamento).remover("s1", "f1.jpg");
    }

    @Test
    void outraPessoaNaoMexeNaFoto() {
        when(repository.findById("s1")).thenReturn(Optional.of(solicitacao("s1", OUTRA_PESSOA)));
        doThrow(new AcessoNegadoException("Só quem criou este item pode alterá-lo."))
                .when(acesso).garantirDono(OUTRA_PESSOA);
        var arquivo = new MockMultipartFile("arquivo", "casaco.jpg", "image/jpeg", new byte[] { 1 });

        assertThatThrownBy(() -> service.adicionarFoto("s1", arquivo)).isInstanceOf(AcessoNegadoException.class);
        assertThatThrownBy(() -> service.removerFoto("s1", "f1")).isInstanceOf(AcessoNegadoException.class);
        verify(armazenamento, never()).salvar(any(), any());
        verify(armazenamento, never()).remover(any(), any());
    }

    @Test
    void donoRemoveAFotoEOArquivo() {
        Solicitacao comFoto = solicitacao("s1", DONO);
        comFoto.adicionarFoto(new Foto("f1", "f1.jpg", "image/jpeg", 2));
        when(repository.findById("s1")).thenReturn(Optional.of(comFoto));

        service.removerFoto("s1", "f1");

        assertThat(comFoto.getFotosReferencia()).isEmpty();
        verify(armazenamento).remover("s1", "f1.jpg");
    }

    @Test
    void removerFotoInexistenteDevolve404() {
        when(repository.findById("s1")).thenReturn(Optional.of(solicitacao("s1", DONO)));

        assertThatThrownBy(() -> service.removerFoto("s1", "nao-existe")).isInstanceOf(RecursoNaoEncontradoException.class);
    }
}
