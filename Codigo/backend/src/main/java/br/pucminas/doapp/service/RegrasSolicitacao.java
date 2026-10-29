package br.pucminas.doapp.service;

import java.util.ArrayList;
import java.util.Optional;

import org.springframework.stereotype.Component;

import br.pucminas.doapp.config.SolicitacaoProperties;
import br.pucminas.doapp.dto.SolicitacaoRequisicao;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.exception.ErroResposta.CampoInvalido;
import br.pucminas.doapp.model.Categoria;
import br.pucminas.doapp.model.Localizacao;
import br.pucminas.doapp.model.Solicitacao;

/**
 * Regras de preenchimento de uma solicitação.
 *
 * <p>Sem burocracia: só título, categoria e urgência são obrigatórios. Descrição e localização são opcionais,
 * mas têm limite de tamanho. Os nomes de campo dos erros são os mesmos usados pelo front-end.
 */
@Component
public class RegrasSolicitacao {

    static final int TITULO_MINIMO = 3;
    static final int LOCAL_MAXIMO = 60;

    private final SolicitacaoProperties solicitacoes;
    private final CategoriaService categorias;

    public RegrasSolicitacao(SolicitacaoProperties solicitacoes, CategoriaService categorias) {
        this.solicitacoes = solicitacoes;
        this.categorias = categorias;
    }

    /** Confere e normaliza os dados e os grava na solicitação; lança um único erro com todos os campos inválidos. */
    public void aplicar(Solicitacao solicitacao, SolicitacaoRequisicao dados) {
        var erros = new ArrayList<CampoInvalido>();

        String titulo = texto(dados.titulo());
        if (titulo == null || titulo.length() < TITULO_MINIMO) {
            erros.add(erro("titulo", "Conte do que você precisa com pelo menos %d letras.".formatted(TITULO_MINIMO)));
        } else if (titulo.length() > solicitacoes.tituloMaximo()) {
            erros.add(erro("titulo", "O título pode ter até %d caracteres.".formatted(solicitacoes.tituloMaximo())));
        }

        String descricao = texto(dados.descricao());
        if (descricao != null && descricao.length() > solicitacoes.descricaoMaximo()) {
            erros.add(erro("descricao",
                    "A descrição pode ter até %d caracteres.".formatted(solicitacoes.descricaoMaximo())));
        }

        Optional<Categoria> categoria = categorias.procurar(texto(dados.categoriaId()));
        if (categoria.isEmpty()) {
            erros.add(erro("categoriaId", "Escolha uma categoria da lista."));
        }

        if (dados.urgencia() == null) {
            erros.add(erro("urgencia", "Escolha para quando você precisa."));
        }

        Localizacao localizacao = localizacao(dados.localizacao());
        if (localizacao != null && localizacao.bairro() != null && localizacao.bairro().length() > LOCAL_MAXIMO) {
            erros.add(erro("localizacao.bairro", "O bairro pode ter até %d caracteres.".formatted(LOCAL_MAXIMO)));
        }
        if (localizacao != null && localizacao.cidade() != null && localizacao.cidade().length() > LOCAL_MAXIMO) {
            erros.add(erro("localizacao.cidade", "A cidade pode ter até %d caracteres.".formatted(LOCAL_MAXIMO)));
        }

        if (!erros.isEmpty()) {
            throw new DadosInvalidosException(erros);
        }

        solicitacao.setTitulo(titulo);
        solicitacao.setDescricao(descricao);
        solicitacao.setCategoriaId(categoria.get().getId());
        solicitacao.setUrgencia(dados.urgencia());
        solicitacao.setLocalizacao(localizacao);
    }

    /** Tira espaços das pontas; texto vazio vira {@code null}. */
    private static String texto(String valor) {
        if (valor == null) {
            return null;
        }
        String limpo = valor.strip();
        return limpo.isEmpty() ? null : limpo;
    }

    private static Localizacao localizacao(Localizacao localizacao) {
        if (localizacao == null) {
            return null;
        }
        String bairro = texto(localizacao.bairro());
        String cidade = texto(localizacao.cidade());
        return bairro == null && cidade == null ? null : new Localizacao(bairro, cidade);
    }

    private static CampoInvalido erro(String campo, String mensagem) {
        return new CampoInvalido(campo, mensagem);
    }
}
