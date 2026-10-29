package br.pucminas.doapp.dto;

import br.pucminas.doapp.model.Localizacao;
import br.pucminas.doapp.model.Urgencia;

/**
 * Dados enviados para cadastrar ou editar uma solicitação. Obrigatórios: título, categoria e urgência.
 * Os limites são conferidos pelo serviço, com os valores do {@code application.yml}.
 */
public record SolicitacaoRequisicao(
        String titulo,
        String descricao,
        String categoriaId,
        Urgencia urgencia,
        Localizacao localizacao) {
}
