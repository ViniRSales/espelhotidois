package br.pucminas.doapp.dto;

import br.pucminas.doapp.model.Foto;

/** Foto de uma doação, com o endereço onde o front-end a carrega. */
public record FotoResposta(String id, String url, String tipo, long tamanho) {

    public static FotoResposta de(String doacaoId, Foto foto) {
        return new FotoResposta(foto.id(), "/api/fotos/" + doacaoId + "/" + foto.arquivo(), foto.tipo(), foto.tamanho());
    }
}
