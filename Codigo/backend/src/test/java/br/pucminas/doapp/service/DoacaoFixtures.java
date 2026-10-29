package br.pucminas.doapp.service;

import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.util.unit.DataSize;

import br.pucminas.doapp.config.DoacaoProperties;
import br.pucminas.doapp.dto.DoacaoRascunhoRequisicao;
import br.pucminas.doapp.model.Categoria;
import br.pucminas.doapp.model.Condicao;
import br.pucminas.doapp.model.Doacao;
import br.pucminas.doapp.model.FormaEntrega;
import br.pucminas.doapp.model.Foto;
import br.pucminas.doapp.model.Localizacao;

/** Dados prontos para os testes de doação. */
final class DoacaoFixtures {

    static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    static final Instant AGORA = Instant.parse("2026-10-27T15:00:00Z");
    static final LocalDate HOJE = LocalDate.ofInstant(AGORA, FUSO);
    static final Clock RELOGIO = Clock.fixed(AGORA, FUSO);

    static final DoacaoProperties PROPRIEDADES = new DoacaoProperties(30, "0 0 3 * * *", 90, 300, 5,
            new DoacaoProperties.Fotos(Path.of("uploads"), 1, 10, DataSize.ofMegabytes(5),
                    List.of("image/jpeg", "image/png", "image/webp")));

    static final Categoria ROUPAS = categoria("cat-roupas", "Roupas");
    static final Categoria ALIMENTOS = categoria("cat-alimentos", CategoriaService.ALIMENTOS);

    private DoacaoFixtures() {
    }

    static Categoria categoria(String id, String nome) {
        var categoria = new Categoria(nome);
        ReflectionTestUtils.setField(categoria, "id", id);
        return categoria;
    }

    static Doacao rascunho(String id, String doadorId) {
        var doacao = new Doacao(doadorId, AGORA);
        ReflectionTestUtils.setField(doacao, "id", id);
        return doacao;
    }

    /** Rascunho com tudo o que a publicação exige. */
    static Doacao rascunhoCompleto(String id, String doadorId) {
        Doacao doacao = rascunho(id, doadorId);
        doacao.setTitulo("Cachecol vermelho");
        doacao.setDescricao("Cachecol de lã, pouco usado.");
        doacao.adicionarFoto(foto("f1"));
        doacao.setCategoriaId(ROUPAS.getId());
        doacao.setTags(List.of("inverno", "lã"));
        doacao.setCondicao(Condicao.EXCELENTE);
        doacao.setFormasEntrega(Set.of(FormaEntrega.A_COMBINAR));
        doacao.setLocalizacao(new Localizacao("Ipiranga", "Belo Horizonte"));
        return doacao;
    }

    static Foto foto(String id) {
        return new Foto(id, id + ".jpg", "image/jpeg", 100);
    }

    static DoacaoRascunhoRequisicao requisicao(String titulo, String categoriaId, List<String> tags) {
        return new DoacaoRascunhoRequisicao(titulo, null, null, categoriaId, tags, null, null, null, null, null);
    }

    static DoacaoRascunhoRequisicao vazia() {
        return requisicao(null, null, null);
    }
}
