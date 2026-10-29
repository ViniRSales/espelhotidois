package br.pucminas.doapp.exception;

import java.util.List;

/**
 * Formato único de erro devolvido pela API.
 * O front-end mostra {@code mensagem} para o usuário e usa {@code campos} para marcar os campos inválidos.
 */
public record ErroResposta(int status, String erro, String mensagem, List<CampoInvalido> campos) {

    public record CampoInvalido(String campo, String mensagem) {
    }

    public static ErroResposta de(int status, String erro, String mensagem) {
        return new ErroResposta(status, erro, mensagem, List.of());
    }
}
