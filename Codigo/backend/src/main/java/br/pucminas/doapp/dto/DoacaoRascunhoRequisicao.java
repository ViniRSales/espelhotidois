package br.pucminas.doapp.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import br.pucminas.doapp.model.Condicao;
import br.pucminas.doapp.model.FormaEntrega;
import br.pucminas.doapp.model.Localizacao;

/**
 * Estado completo do rascunho enviado pelo assistente de cadastro. Todos os campos são opcionais: o que vier vazio
 * fica vazio no rascunho. Os limites são conferidos pelo serviço, com os valores do {@code application.yml}.
 *
 * @param ordemFotos ids das fotos já enviadas, na ordem desejada (a primeira é a capa); {@code null} mantém a ordem
 */
public record DoacaoRascunhoRequisicao(
        String titulo,
        String descricao,
        List<String> ordemFotos,
        String categoriaId,
        List<String> tags,
        Condicao condicao,
        Set<FormaEntrega> formasEntrega,
        LocalDate validade,
        Boolean naoPerecivel,
        Localizacao localizacao) {
}
