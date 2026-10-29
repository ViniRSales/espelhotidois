package br.pucminas.doapp.exception;

/** Usuário autenticado tentou alterar um recurso que não é dele (HTTP 403). */
public class AcessoNegadoException extends RuntimeException {

    public AcessoNegadoException(String mensagem) {
        super(mensagem);
    }
}
