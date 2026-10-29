package br.pucminas.doapp.dto;

import java.time.Instant;
import java.util.List;

import br.pucminas.doapp.model.Localizacao;
import br.pucminas.doapp.model.SituacaoSolicitacao;
import br.pucminas.doapp.model.Solicitacao;
import br.pucminas.doapp.model.Urgencia;

/**
 * Solicitação devolvida pela API. Não traz o id nem os contatos de quem pediu (RNF03);
 * {@code souDono} só diz se o usuário logado é o autor, para o front-end mostrar editar e cancelar.
 */
public record SolicitacaoResposta(
        String id,
        String titulo,
        String descricao,
        CategoriaResposta categoria,
        Urgencia urgencia,
        Localizacao localizacao,
        List<FotoResposta> fotos,
        SituacaoSolicitacao situacao,
        Instant dataCadastro,
        Instant atualizadaEm,
        boolean souDono) {

    /** Monta a resposta; a categoria vem à parte porque a solicitação só guarda o id dela. */
    public static SolicitacaoResposta de(Solicitacao solicitacao, CategoriaResposta categoria, boolean souDono) {
        return new SolicitacaoResposta(
                solicitacao.getId(),
                solicitacao.getTitulo(),
                solicitacao.getDescricao(),
                categoria,
                solicitacao.getUrgencia(),
                solicitacao.getLocalizacao(),
                solicitacao.getFotosReferencia().stream().map(foto -> FotoResposta.de(solicitacao.getId(), foto)).toList(),
                solicitacao.getSituacao(),
                solicitacao.getDataCadastro(),
                solicitacao.getAtualizadaEm(),
                souDono);
    }
}
