package br.pucminas.doapp.exception;

/** Tentativas demais num intervalo curto, como chutar senhas no login (HTTP 429). */
public class MuitasTentativasException extends RuntimeException {

    public MuitasTentativasException(String mensagem) {
        super(mensagem);
    }
}
