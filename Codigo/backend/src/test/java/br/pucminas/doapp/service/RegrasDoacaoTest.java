package br.pucminas.doapp.service;

import static br.pucminas.doapp.service.DoacaoFixtures.ALIMENTOS;
import static br.pucminas.doapp.service.DoacaoFixtures.HOJE;
import static br.pucminas.doapp.service.DoacaoFixtures.PROPRIEDADES;
import static br.pucminas.doapp.service.DoacaoFixtures.RELOGIO;
import static br.pucminas.doapp.service.DoacaoFixtures.ROUPAS;
import static br.pucminas.doapp.service.DoacaoFixtures.foto;
import static br.pucminas.doapp.service.DoacaoFixtures.rascunho;
import static br.pucminas.doapp.service.DoacaoFixtures.rascunhoCompleto;
import static br.pucminas.doapp.service.DoacaoFixtures.requisicao;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import br.pucminas.doapp.dto.DoacaoRascunhoRequisicao;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.exception.ErroResposta.CampoInvalido;
import br.pucminas.doapp.model.Condicao;
import br.pucminas.doapp.model.Doacao;
import br.pucminas.doapp.model.FormaEntrega;
import br.pucminas.doapp.model.Localizacao;

@ExtendWith(MockitoExtension.class)
class RegrasDoacaoTest {

    @Mock
    private CategoriaService categorias;

    private RegrasDoacao regras;

    @BeforeEach
    void criarRegras() {
        regras = new RegrasDoacao(PROPRIEDADES, categorias, RELOGIO);
        lenient().when(categorias.procurar(any())).thenReturn(Optional.empty());
        lenient().when(categorias.procurar(ROUPAS.getId())).thenReturn(Optional.of(ROUPAS));
        lenient().when(categorias.procurar(ALIMENTOS.getId())).thenReturn(Optional.of(ALIMENTOS));
    }

    @Test
    void rascunhoNormalizaTextosETags() {
        var doacao = rascunho("d1", "u1");
        var dados = new DoacaoRascunhoRequisicao("  Cachecol vermelho  ", "   ", null, ROUPAS.getId(),
                List.of(" Inverno", "inverno", "LÃ", " "), Condicao.BOM, Set.of(FormaEntrega.A_COMBINAR),
                HOJE, true, new Localizacao(" Ipiranga ", ""));

        regras.aplicarRascunho(doacao, dados);

        assertThat(doacao.getTitulo()).isEqualTo("Cachecol vermelho");
        assertThat(doacao.getDescricao()).isNull();
        assertThat(doacao.getTags()).containsExactly("inverno", "lã");
        assertThat(doacao.getCategoriaId()).isEqualTo(ROUPAS.getId());
        assertThat(doacao.getLocalizacao()).isEqualTo(new Localizacao("Ipiranga", null));
        assertThat(doacao.getCondicao()).isEqualTo(Condicao.BOM);
        assertThat(doacao.getFormasEntrega()).containsExactly(FormaEntrega.A_COMBINAR);
    }

    @Test
    void rascunhoForaDeAlimentosDescartaValidade() {
        var doacao = rascunho("d1", "u1");

        regras.aplicarRascunho(doacao, comValidade(ROUPAS.getId(), false));

        assertThat(doacao.getValidade()).isNull();
        assertThat(doacao.getNaoPerecivel()).isNull();
    }

    @Test
    void alimentoGuardaValidadeOuNaoPerecivel() {
        var perecivel = rascunho("d1", "u1");
        var naoPerecivel = rascunho("d2", "u1");

        regras.aplicarRascunho(perecivel, comValidade(ALIMENTOS.getId(), false));
        regras.aplicarRascunho(naoPerecivel, comValidade(ALIMENTOS.getId(), true));

        assertThat(perecivel.getValidade()).isEqualTo(HOJE.plusDays(10));
        assertThat(perecivel.getNaoPerecivel()).isFalse();
        assertThat(naoPerecivel.getValidade()).isNull();
        assertThat(naoPerecivel.getNaoPerecivel()).isTrue();
    }

    @Test
    void rascunhoReordenaAsFotos() {
        var doacao = rascunho("d1", "u1");
        doacao.adicionarFoto(foto("a"));
        doacao.adicionarFoto(foto("b"));

        regras.aplicarRascunho(doacao, new DoacaoRascunhoRequisicao(null, null, List.of("b", "a"), null, null,
                null, null, null, null, null));

        assertThat(doacao.getFotos()).extracting("id").containsExactly("b", "a");
    }

    @Test
    void rascunhoRecusaLimitesECategoriaInexistenteSemAlterarNada() {
        var doacao = rascunho("d1", "u1");
        var tags = List.of("a", "b2", "c3", "d4", "e5", "f6");

        assertCampos(() -> regras.aplicarRascunho(doacao, requisicao("x".repeat(91), "nao-existe", tags)),
                "titulo", "categoriaId", "tags", "tags");
        assertThat(doacao.getTitulo()).isNull();
    }

    @Test
    void rascunhoRecusaDescricaoEBairroLongosDemais() {
        var dados = new DoacaoRascunhoRequisicao(null, "x".repeat(301), null, null, null, null, null, null, null,
                new Localizacao("b".repeat(61), "c".repeat(61)));

        assertCampos(() -> regras.aplicarRascunho(rascunho("d1", "u1"), dados),
                "descricao", "localizacao.bairro", "localizacao.cidade");
    }

    @Test
    void publicacaoAceitaRascunhoCompleto() {
        regras.validarPublicacao(rascunhoCompleto("d1", "u1"));
    }

    @Test
    void publicacaoListaTodosOsCamposQueFaltam() {
        assertCampos(() -> regras.validarPublicacao(rascunho("d1", "u1")),
                "titulo", "descricao", "fotos", "categoriaId", "condicao", "formasEntrega",
                "localizacao.bairro", "localizacao.cidade");
    }

    @Test
    void publicacaoExigeTituloComTresLetrasEAteDezFotos() {
        Doacao doacao = rascunhoCompleto("d1", "u1");
        doacao.setTitulo("ab");
        for (int i = 0; i < 10; i++) {
            doacao.adicionarFoto(foto("extra" + i));
        }

        assertCampos(() -> regras.validarPublicacao(doacao), "titulo", "fotos");
    }

    @Test
    void alimentoPerecivelPrecisaDeValidadeDeHojeEmDiante() {
        Doacao semValidade = alimento(null, false);
        Doacao vencido = alimento(HOJE.minusDays(1), false);

        assertCampos(() -> regras.validarPublicacao(semValidade), "validade");
        assertCampos(() -> regras.validarPublicacao(vencido), "validade");
        regras.validarPublicacao(alimento(HOJE, false));
        regras.validarPublicacao(alimento(null, true));
    }

    private Doacao alimento(LocalDate validade, boolean naoPerecivel) {
        Doacao doacao = rascunhoCompleto("d1", "u1");
        doacao.setCategoriaId(ALIMENTOS.getId());
        doacao.setValidade(validade);
        doacao.setNaoPerecivel(naoPerecivel);
        return doacao;
    }

    private static DoacaoRascunhoRequisicao comValidade(String categoriaId, boolean naoPerecivel) {
        return new DoacaoRascunhoRequisicao(null, null, null, categoriaId, null, null, null, HOJE.plusDays(10),
                naoPerecivel, null);
    }

    private static void assertCampos(ThrowingCallable acao, String... campos) {
        assertThatThrownBy(acao)
                .isInstanceOf(DadosInvalidosException.class)
                .satisfies(ex -> assertThat(((DadosInvalidosException) ex).getCampos())
                        .extracting(CampoInvalido::campo)
                        .containsExactly(campos));
    }
}
