package br.pucminas.doapp.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;

import org.junit.jupiter.api.Test;

class SolicitacaoTest {

    private static final Instant AGORA = Instant.parse("2026-10-27T12:00:00Z");
    private static final Instant DEPOIS = Instant.parse("2026-10-28T12:00:00Z");

    @Test
    void nasceAberta() {
        var solicitacao = new Solicitacao("usuario-1", AGORA);

        assertThat(solicitacao.ehAberta()).isTrue();
        assertThat(solicitacao.getReceptorId()).isEqualTo("usuario-1");
        assertThat(solicitacao.getDataCadastro()).isEqualTo(AGORA);
        assertThat(solicitacao.getAtualizadaEm()).isEqualTo(AGORA);
    }

    @Test
    void cancelarMudaSituacaoEDataDeAlteracao() {
        var solicitacao = new Solicitacao("usuario-1", AGORA);

        solicitacao.cancelar(DEPOIS);

        assertThat(solicitacao.getSituacao()).isEqualTo(SituacaoSolicitacao.CANCELADA);
        assertThat(solicitacao.ehAberta()).isFalse();
        assertThat(solicitacao.getAtualizadaEm()).isEqualTo(DEPOIS);
        assertThat(solicitacao.getDataCadastro()).isEqualTo(AGORA);
    }

    @Test
    void naoCancelaDuasVezes() {
        var solicitacao = new Solicitacao("usuario-1", AGORA);
        solicitacao.cancelar(AGORA);

        assertThatThrownBy(() -> solicitacao.cancelar(DEPOIS)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void adicionaERemoveFotoDeReferencia() {
        var solicitacao = new Solicitacao("usuario-1", AGORA);
        var foto = new Foto("f1", "f1.jpg", "image/jpeg", 100);
        solicitacao.adicionarFoto(foto);

        assertThat(solicitacao.removerFoto("nao-existe")).isNull();
        assertThat(solicitacao.removerFoto("f1")).isEqualTo(foto);
        assertThat(solicitacao.getFotosReferencia()).isEmpty();
    }
}
