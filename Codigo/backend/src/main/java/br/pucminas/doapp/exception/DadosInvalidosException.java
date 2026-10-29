package br.pucminas.doapp.exception;

import java.util.List;

import br.pucminas.doapp.exception.ErroResposta.CampoInvalido;

/** Dados recusados por uma regra do serviço (HTTP 400), com a mensagem de cada campo inválido. */
public class DadosInvalidosException extends RuntimeException {

    private final List<CampoInvalido> campos;

    public DadosInvalidosException(List<CampoInvalido> campos) {
        super("Confira os campos destacados e tente de novo.");
        this.campos = List.copyOf(campos);
    }

    public DadosInvalidosException(String campo, String mensagem) {
        this(List.of(new CampoInvalido(campo, mensagem)));
    }

    public List<CampoInvalido> getCampos() {
        return campos;
    }
}
