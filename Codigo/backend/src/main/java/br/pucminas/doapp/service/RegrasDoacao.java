package br.pucminas.doapp.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Component;

import br.pucminas.doapp.config.DoacaoProperties;
import br.pucminas.doapp.dto.DoacaoRascunhoRequisicao;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.exception.ErroResposta.CampoInvalido;
import br.pucminas.doapp.model.Categoria;
import br.pucminas.doapp.model.Doacao;
import br.pucminas.doapp.model.Localizacao;

/**
 * Regras de preenchimento de uma doação.
 *
 * <p>O rascunho aceita campos vazios e só recusa o que nunca seria válido (textos longos demais, categoria
 * inexistente). A publicação exige tudo. Os nomes de campo dos erros são os mesmos usados pelo front-end.
 */
@Component
public class RegrasDoacao {

    static final int TITULO_MINIMO = 3;
    static final int TAG_MINIMO = 2;
    static final int TAG_MAXIMO = 30;
    static final int LOCAL_MINIMO = 2;
    static final int LOCAL_MAXIMO = 60;

    private final DoacaoProperties doacoes;
    private final CategoriaService categorias;
    private final Clock relogio;

    public RegrasDoacao(DoacaoProperties doacoes, CategoriaService categorias, Clock relogio) {
        this.doacoes = doacoes;
        this.categorias = categorias;
        this.relogio = relogio;
    }

    /** Normaliza os dados enviados e os grava no rascunho, substituindo os anteriores. */
    public void aplicarRascunho(Doacao doacao, DoacaoRascunhoRequisicao dados) {
        var erros = new ArrayList<CampoInvalido>();

        String titulo = texto(dados.titulo());
        if (titulo != null && titulo.length() > doacoes.tituloMaximo()) {
            erros.add(erro("titulo", "O nome pode ter até %d caracteres.".formatted(doacoes.tituloMaximo())));
        }

        String descricao = texto(dados.descricao());
        if (descricao != null && descricao.length() > doacoes.descricaoMaximo()) {
            erros.add(erro("descricao", "A descrição pode ter até %d caracteres.".formatted(doacoes.descricaoMaximo())));
        }

        Optional<Categoria> categoria = categorias.procurar(texto(dados.categoriaId()));
        if (dados.categoriaId() != null && categoria.isEmpty()) {
            erros.add(erro("categoriaId", "Escolha uma categoria da lista."));
        }

        List<String> tags = tags(dados.tags());
        if (tags.size() > doacoes.tagsMaximo()) {
            erros.add(erro("tags", "Use no máximo %d tags.".formatted(doacoes.tagsMaximo())));
        }
        if (tags.stream().anyMatch(tag -> tag.length() < TAG_MINIMO || tag.length() > TAG_MAXIMO)) {
            erros.add(erro("tags", "Cada tag precisa ter de %d a %d caracteres.".formatted(TAG_MINIMO, TAG_MAXIMO)));
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

        doacao.setTitulo(titulo);
        doacao.setDescricao(descricao);
        doacao.setCategoriaId(categoria.map(Categoria::getId).orElse(null));
        doacao.setTags(tags);
        doacao.setCondicao(dados.condicao());
        doacao.setFormasEntrega(dados.formasEntrega() == null ? Set.of() : dados.formasEntrega());
        doacao.setLocalizacao(localizacao);
        if (dados.ordemFotos() != null) {
            doacao.reordenarFotos(dados.ordemFotos());
        }

        // Validade só existe para alimentos; marcar "não perecível" dispensa a data.
        boolean alimento = categoria.map(RegrasDoacao::ehAlimento).orElse(false);
        boolean naoPerecivel = Boolean.TRUE.equals(dados.naoPerecivel());
        doacao.setNaoPerecivel(alimento ? naoPerecivel : null);
        doacao.setValidade(alimento && !naoPerecivel ? dados.validade() : null);
    }

    /** Confere tudo o que a publicação exige e lança um único erro com todos os campos que faltam. */
    public void validarPublicacao(Doacao doacao) {
        var erros = new ArrayList<CampoInvalido>();

        if (doacao.getTitulo() == null || doacao.getTitulo().length() < TITULO_MINIMO) {
            erros.add(erro("titulo", "Dê um nome ao item com pelo menos %d letras.".formatted(TITULO_MINIMO)));
        }
        if (doacao.getDescricao() == null) {
            erros.add(erro("descricao", "Conte um pouco sobre o item."));
        }

        int fotos = doacao.getFotos().size();
        if (fotos < doacoes.fotos().minimo()) {
            erros.add(erro("fotos", "Adicione pelo menos uma foto do item."));
        } else if (fotos > doacoes.fotos().maximo()) {
            erros.add(erro("fotos", "Use no máximo %d fotos.".formatted(doacoes.fotos().maximo())));
        }

        Optional<Categoria> categoria = categorias.procurar(doacao.getCategoriaId());
        if (categoria.isEmpty()) {
            erros.add(erro("categoriaId", "Escolha uma categoria."));
        }
        if (doacao.getTags().size() > doacoes.tagsMaximo()) {
            erros.add(erro("tags", "Use no máximo %d tags.".formatted(doacoes.tagsMaximo())));
        }
        if (doacao.getCondicao() == null) {
            erros.add(erro("condicao", "Conte em que estado o item está."));
        }
        if (doacao.getFormasEntrega().isEmpty()) {
            erros.add(erro("formasEntrega", "Escolha pelo menos uma forma de entrega."));
        }

        if (categoria.map(RegrasDoacao::ehAlimento).orElse(false) && !Boolean.TRUE.equals(doacao.getNaoPerecivel())) {
            if (doacao.getValidade() == null) {
                erros.add(erro("validade", "Informe a validade ou marque como não perecível."));
            } else if (doacao.getValidade().isBefore(LocalDate.now(relogio))) {
                erros.add(erro("validade", "A validade precisa ser hoje ou uma data futura."));
            }
        }

        Localizacao localizacao = doacao.getLocalizacao();
        if (localizacao == null || tamanhoForaDe(localizacao.bairro(), LOCAL_MINIMO, LOCAL_MAXIMO)) {
            erros.add(erro("localizacao.bairro", "Informe o bairro."));
        }
        if (localizacao == null || tamanhoForaDe(localizacao.cidade(), LOCAL_MINIMO, LOCAL_MAXIMO)) {
            erros.add(erro("localizacao.cidade", "Informe a cidade."));
        }

        if (!erros.isEmpty()) {
            throw new DadosInvalidosException(erros);
        }
    }

    private static boolean ehAlimento(Categoria categoria) {
        return CategoriaService.ALIMENTOS.equals(categoria.getNome());
    }

    /** Tira espaços das pontas; texto vazio vira {@code null}. */
    private static String texto(String valor) {
        if (valor == null) {
            return null;
        }
        String limpo = valor.strip();
        return limpo.isEmpty() ? null : limpo;
    }

    /** Tags em minúsculas, sem espaços nas pontas, sem vazias e sem repetidas (mantendo a ordem). */
    private static List<String> tags(List<String> tags) {
        if (tags == null) {
            return List.of();
        }
        var unicas = new LinkedHashSet<String>();
        for (String tag : tags) {
            String limpa = texto(tag);
            if (limpa != null) {
                unicas.add(limpa.toLowerCase(Locale.ROOT));
            }
        }
        return List.copyOf(unicas);
    }

    private static Localizacao localizacao(Localizacao localizacao) {
        if (localizacao == null) {
            return null;
        }
        String bairro = texto(localizacao.bairro());
        String cidade = texto(localizacao.cidade());
        return bairro == null && cidade == null ? null : new Localizacao(bairro, cidade);
    }

    private static boolean tamanhoForaDe(String valor, int minimo, int maximo) {
        return valor == null || valor.length() < minimo || valor.length() > maximo;
    }

    private static CampoInvalido erro(String campo, String mensagem) {
        return new CampoInvalido(campo, mensagem);
    }
}
