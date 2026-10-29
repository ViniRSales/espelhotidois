package br.pucminas.doapp.dto;

import java.util.Locale;

import br.pucminas.doapp.model.TipoConta;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Dados para criar uma conta. Os textos chegam normalizados (sem espaços nas pontas, e-mail em minúsculas,
 * telefone só com dígitos) antes da validação. O front-end repete estas regras em
 * {@code features/autenticacao/validacao.ts}.
 */
public record CadastroRequisicao(
        @NotNull(message = "Conte se você é pessoa física ou instituição.")
        TipoConta tipo,

        @NotBlank(message = "Informe seu nome.")
        @Size(min = 2, max = 100, message = "Informe seu nome.")
        String nome,

        @NotBlank(message = EMAIL_INVALIDO)
        @Email(regexp = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+", message = EMAIL_INVALIDO)
        @Size(max = 254, message = EMAIL_INVALIDO)
        String email,

        @NotBlank(message = TELEFONE_INVALIDO)
        @Pattern(regexp = "\\d{10,11}", message = TELEFONE_INVALIDO)
        String telefone,

        @NotBlank(message = "Informe o bairro.")
        @Size(min = 2, max = 60, message = "Informe o bairro.")
        String bairro,

        @NotBlank(message = "Informe a cidade.")
        @Size(min = 2, max = 60, message = "Informe a cidade.")
        String cidade,

        @NotBlank(message = UF_INVALIDA)
        @Pattern(regexp = UFS, message = UF_INVALIDA)
        String uf,

        @NotNull(message = SENHA_CURTA)
        @Size(min = 8, message = SENHA_CURTA)
        @Size(max = 72, message = "Use no máximo 72 caracteres.")
        String senha) {

    static final String EMAIL_INVALIDO = "Informe um e-mail válido, como nome@email.com.";
    static final String TELEFONE_INVALIDO = "Informe o telefone com DDD.";
    static final String SENHA_CURTA = "A senha precisa ter pelo menos 8 caracteres.";
    static final String UF_INVALIDA = "Informe o estado.";
    /** Siglas das 27 unidades da federação. */
    static final String UFS = "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO";

    public CadastroRequisicao {
        nome = aparar(nome);
        email = normalizarEmail(email);
        telefone = telefone == null ? null : telefone.replaceAll("\\D", "");
        bairro = aparar(bairro);
        cidade = aparar(cidade);
        uf = uf == null ? null : uf.strip().toUpperCase(Locale.ROOT);
    }

    /** Nunca mostra a senha em logs ou mensagens de erro. */
    @Override
    public String toString() {
        return "CadastroRequisicao[tipo=%s, email=%s]".formatted(tipo, email);
    }

    static String aparar(String texto) {
        return texto == null ? null : texto.strip();
    }

    static String normalizarEmail(String email) {
        return email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }
}
