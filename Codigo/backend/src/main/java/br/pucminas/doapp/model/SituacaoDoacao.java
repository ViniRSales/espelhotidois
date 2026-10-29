package br.pucminas.doapp.model;

/**
 * Situação de uma doação. Depois de publicada, segue disponível → reservada → a caminho → entregue;
 * pode ser cancelada ou expirar quando o prazo de disponibilidade termina.
 */
public enum SituacaoDoacao {
    RASCUNHO,
    DISPONIVEL,
    RESERVADA,
    A_CAMINHO,
    ENTREGUE,
    CANCELADA,
    EXPIRADA
}
