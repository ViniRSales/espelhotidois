package br.pucminas.doapp.service;

import static br.pucminas.doapp.service.SolicitacaoFixtures.AGORA;
import static br.pucminas.doapp.service.SolicitacaoFixtures.PROPRIEDADES;
import static br.pucminas.doapp.service.SolicitacaoFixtures.ROUPAS;
import static br.pucminas.doapp.service.SolicitacaoFixtures.requisicao;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import br.pucminas.doapp.dto.SolicitacaoRequisicao;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.exception.ErroResposta.CampoInvalido;
import br.pucminas.doapp.model.Localizacao;
import br.pucminas.doapp.model.Solicitacao;
import br.pucminas.doapp.model.Urgencia;

@ExtendWith(MockitoExtension.class)
class RegrasSolicitacaoTest {

    @Mock
    private CategoriaService categorias;

    private RegrasSolicitacao regras;
    private Solicitacao solicitacao;

    @BeforeEach
    void criarRegras() {
        regras = new RegrasSolicitacao(PROPRIEDADES, categorias);
        solicitacao = new Solicitacao("usuario-1", AGORA);
        lenient().when(categorias.procurar(any())).thenReturn(Optional.empty());
        lenient().when(categorias.procurar(ROUPAS.getId())).thenReturn(Optional.of(ROUPAS));
    }

    @Test
    void aceitaSoOsCamposObrigatorios() {
        regras.aplicar(solicitacao, requisicao());

        assertThat(solicitacao.getTitulo()).isEqualTo("Roupas de frio para crianças");
        assertThat(solicitacao.getCategoriaId()).isEqualTo(ROUPAS.getId());
        assertThat(solicitacao.getUrgencia()).isEqualTo(Urgencia.ALTA);
        assertThat(solicitacao.getDescricao()).isNull();
        assertThat(solicitacao.getLocalizacao()).isNull();
    }

    @Test
    void recusaTodosOsObrigatoriosDeUmaVez() {
        var vazia = new SolicitacaoRequisicao("  ", null, null, null, null);

        assertThatThrownBy(() -> regras.aplicar(solicitacao, vazia))
                .isInstanceOfSatisfying(DadosInvalidosException.class, e -> assertThat(e.getCampos())
                        .extracting(CampoInvalido::campo)
                        .containsExactly("titulo", "categoriaId", "urgencia"));
    }

    @Test
    void recusaCategoriaQueNaoExiste() {
        var dados = new SolicitacaoRequisicao("Fraldas", null, "nao-existe", Urgencia.MEDIA, null);

        assertThatThrownBy(() -> regras.aplicar(solicitacao, dados))
                .isInstanceOfSatisfying(DadosInvalidosException.class, e -> assertThat(e.getCampos())
                        .extracting(CampoInvalido::campo)
                        .containsExactly("categoriaId"));
    }

    @Test
    void recusaTextosLongosDemais() {
        var dados = requisicao("a".repeat(91), "b".repeat(501), new Localizacao("c".repeat(61), "d".repeat(61)));

        assertThatThrownBy(() -> regras.aplicar(solicitacao, dados))
                .isInstanceOfSatisfying(DadosInvalidosException.class, e -> assertThat(e.getCampos())
                        .extracting(CampoInvalido::campo)
                        .containsExactly("titulo", "descricao", "localizacao.bairro", "localizacao.cidade"));
    }

    @Test
    void naoAlteraNadaQuandoHaErro() {
        regras.aplicar(solicitacao, requisicao());
        var invalida = new SolicitacaoRequisicao("Outro título", null, ROUPAS.getId(), null, null);

        assertThatThrownBy(() -> regras.aplicar(solicitacao, invalida)).isInstanceOf(DadosInvalidosException.class);
        assertThat(solicitacao.getTitulo()).isEqualTo("Roupas de frio para crianças");
    }

    @Test
    void limpaEspacosEDescartaTextoVazio() {
        regras.aplicar(solicitacao, requisicao("  Casaco infantil  ", "   ", new Localizacao(" Ipiranga ", " ")));

        assertThat(solicitacao.getTitulo()).isEqualTo("Casaco infantil");
        assertThat(solicitacao.getDescricao()).isNull();
        assertThat(solicitacao.getLocalizacao()).isEqualTo(new Localizacao("Ipiranga", null));
    }

    @Test
    void localizacaoTodaVaziaViraNula() {
        regras.aplicar(solicitacao, requisicao("Casaco infantil", null, new Localizacao(" ", "")));

        assertThat(solicitacao.getLocalizacao()).isNull();
    }
}
