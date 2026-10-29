package br.pucminas.doapp.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import br.pucminas.doapp.model.Condicao;
import br.pucminas.doapp.model.Doacao;
import br.pucminas.doapp.model.FormaEntrega;
import br.pucminas.doapp.model.Localizacao;
import br.pucminas.doapp.model.SituacaoDoacao;

/** Doação devolvida pela API. Não traz o id do doador, para não expor quem doa (RNF03). */
public record DoacaoResposta(
        String id,
        String titulo,
        String descricao,
        List<FotoResposta> fotos,
        CategoriaResposta categoria,
        List<String> tags,
        Condicao condicao,
        List<FormaEntrega> formasEntrega,
        LocalDate validade,
        Boolean naoPerecivel,
        Localizacao localizacao,
        SituacaoDoacao situacao,
        Instant dataCadastro,
        Instant atualizadaEm,
        Instant publicadaEm,
        Instant expiraEm) {

    /** Monta a resposta; a categoria vem à parte porque a doação só guarda o id dela. */
    public static DoacaoResposta de(Doacao doacao, CategoriaResposta categoria) {
        return new DoacaoResposta(
                doacao.getId(),
                doacao.getTitulo(),
                doacao.getDescricao(),
                doacao.getFotos().stream().map(foto -> FotoResposta.de(doacao.getId(), foto)).toList(),
                categoria,
                doacao.getTags(),
                doacao.getCondicao(),
                doacao.getFormasEntrega().stream().sorted().toList(),
                doacao.getValidade(),
                doacao.getNaoPerecivel(),
                doacao.getLocalizacao(),
                doacao.getSituacao(),
                doacao.getDataCadastro(),
                doacao.getAtualizadaEm(),
                doacao.getPublicadaEm(),
                doacao.getExpiraEm());
    }
}
