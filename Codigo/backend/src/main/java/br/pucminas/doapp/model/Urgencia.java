package br.pucminas.doapp.model;

/**
 * Para quando o receptor precisa do que pediu. Pedidos {@link #ALTA} aparecem em destaque (RF15).
 * O texto mostrado na tela ("Sem pressa", "Em breve", "Urgente") fica no front-end.
 */
public enum Urgencia {
    BAIXA,
    MEDIA,
    ALTA
}
