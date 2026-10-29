package br.pucminas.doapp.exception;

/** A operação exige login e não há usuário autenticado (HTTP 401). */
public class NaoAutenticadoException extends RuntimeException {

    public NaoAutenticadoException(String mensagem) {
        super(mensagem);
    }
}
