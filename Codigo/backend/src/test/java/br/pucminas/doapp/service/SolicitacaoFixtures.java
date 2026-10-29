package br.pucminas.doapp.service;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import org.springframework.test.util.ReflectionTestUtils;

import br.pucminas.doapp.config.SolicitacaoProperties;
import br.pucminas.doapp.dto.SolicitacaoRequisicao;
import br.pucminas.doapp.model.Categoria;
import br.pucminas.doapp.model.Localizacao;
import br.pucminas.doapp.model.Solicitacao;
import br.pucminas.doapp.model.Urgencia;

/** Dados prontos para os testes de solicitação. */
final class SolicitacaoFixtures {

    static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    static final Instant AGORA = Instant.parse("2026-10-28T15:00:00Z");
    static final Clock RELOGIO = Clock.fixed(AGORA, FUSO);

    static final SolicitacaoProperties PROPRIEDADES = new SolicitacaoProperties(90, 500, 1);

    static final Categoria ROUPAS = DoacaoFixtures.categoria("cat-roupas", "Roupas");

    private SolicitacaoFixtures() {
    }

    static Solicitacao solicitacao(String id, String receptorId) {
        var solicitacao = new Solicitacao(receptorId, AGORA);
        ReflectionTestUtils.setField(solicitacao, "id", id);
        solicitacao.setTitulo("Roupas de frio para crianças");
        solicitacao.setCategoriaId(ROUPAS.getId());
        solicitacao.setUrgencia(Urgencia.ALTA);
        return solicitacao;
    }

    /** Requisição válida, só com os campos obrigatórios. */
    static SolicitacaoRequisicao requisicao() {
        return new SolicitacaoRequisicao("Roupas de frio para crianças", null, ROUPAS.getId(), Urgencia.ALTA, null);
    }

    static SolicitacaoRequisicao requisicao(String titulo, String descricao, Localizacao localizacao) {
        return new SolicitacaoRequisicao(titulo, descricao, ROUPAS.getId(), Urgencia.ALTA, localizacao);
    }
}
