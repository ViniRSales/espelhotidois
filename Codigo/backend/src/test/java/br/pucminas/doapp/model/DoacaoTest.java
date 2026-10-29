package br.pucminas.doapp.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;

class DoacaoTest {

    private static final Instant AGORA = Instant.parse("2026-10-27T12:00:00Z");

    @Test
    void nasceComoRascunho() {
        var doacao = new Doacao("usuario-1", AGORA);

        assertThat(doacao.ehRascunho()).isTrue();
        assertThat(doacao.getDoadorId()).isEqualTo("usuario-1");
        assertThat(doacao.getDataCadastro()).isEqualTo(AGORA);
        assertThat(doacao.getPublicadaEm()).isNull();
    }

    @Test
    void publicarDefineSituacaoEPrazo() {
        var doacao = new Doacao("usuario-1", AGORA);

        doacao.publicar(AGORA, Duration.ofDays(30));

        assertThat(doacao.getSituacao()).isEqualTo(SituacaoDoacao.DISPONIVEL);
        assertThat(doacao.getPublicadaEm()).isEqualTo(AGORA);
        assertThat(doacao.getExpiraEm()).isEqualTo(Instant.parse("2026-11-26T12:00:00Z"));
    }

    @Test
    void naoPublicaDuasVezes() {
        var doacao = new Doacao("usuario-1", AGORA);
        doacao.publicar(AGORA, Duration.ofDays(30));

        assertThatThrownBy(() -> doacao.publicar(AGORA, Duration.ofDays(30)))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void expiraSoQuandoDisponivel() {
        var doacao = new Doacao("usuario-1", AGORA);

        assertThatThrownBy(() -> doacao.expirar(AGORA)).isInstanceOf(IllegalStateException.class);

        doacao.publicar(AGORA, Duration.ofDays(30));
        doacao.expirar(AGORA.plus(Duration.ofDays(31)));

        assertThat(doacao.getSituacao()).isEqualTo(SituacaoDoacao.EXPIRADA);
    }

    @Test
    void reordenaFotosEMantemAsNaoListadasNoFim() {
        var doacao = new Doacao("usuario-1", AGORA);
        doacao.adicionarFoto(foto("a"));
        doacao.adicionarFoto(foto("b"));
        doacao.adicionarFoto(foto("c"));

        doacao.reordenarFotos(List.of("c", "x", "a"));

        assertThat(doacao.getFotos()).extracting(Foto::id).containsExactly("c", "a", "b");
    }

    @Test
    void removerFotoDevolveAFotoRemovida() {
        var doacao = new Doacao("usuario-1", AGORA);
        doacao.adicionarFoto(foto("a"));

        assertThat(doacao.removerFoto("a")).isEqualTo(foto("a"));
        assertThat(doacao.getFotos()).isEmpty();
        assertThat(doacao.removerFoto("a")).isNull();
    }

    private static Foto foto(String id) {
        return new Foto(id, id + ".jpg", "image/jpeg", 100);
    }
}
