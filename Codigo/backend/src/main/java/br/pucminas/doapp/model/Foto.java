package br.pucminas.doapp.model;

/**
 * Foto de uma doação.
 *
 * @param id identificador da foto dentro da doação
 * @param arquivo nome do arquivo gerado pelo armazenamento (nunca o nome enviado pelo usuário)
 * @param tipo tipo de mídia, por exemplo {@code image/jpeg}
 * @param tamanho tamanho em bytes
 */
public record Foto(String id, String arquivo, String tipo, long tamanho) {
}
