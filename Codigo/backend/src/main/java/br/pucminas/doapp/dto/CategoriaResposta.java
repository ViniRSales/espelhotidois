package br.pucminas.doapp.dto;

import br.pucminas.doapp.model.Categoria;

public record CategoriaResposta(String id, String nome) {

    public static CategoriaResposta de(Categoria categoria) {
        return new CategoriaResposta(categoria.getId(), categoria.getNome());
    }
}
