package br.pucminas.doapp.exception;

/** Arquivo enviado acima do tamanho permitido (HTTP 413). */
public class ArquivoMuitoGrandeException extends RuntimeException {

    public ArquivoMuitoGrandeException(String mensagem) {
        super(mensagem);
    }
}
