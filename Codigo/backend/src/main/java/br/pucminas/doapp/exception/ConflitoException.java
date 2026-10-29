package br.pucminas.doapp.exception;

/** Operação conflita com o estado atual dos dados, como um e-mail já cadastrado (HTTP 409). */
public class ConflitoException extends RuntimeException {

    public ConflitoException(String mensagem) {
        super(mensagem);
    }
}
