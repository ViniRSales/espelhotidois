package br.pucminas.doapp.model;

/**
 * Situação de uma solicitação. Nasce aberta; termina atendida, quando o receptor recebe o que pediu,
 * ou cancelada, quando ele desiste do pedido.
 */
public enum SituacaoSolicitacao {
    ABERTA,
    ATENDIDA,
    CANCELADA
}
