package br.pucminas.doapp.dto;

import br.pucminas.doapp.model.LocalizacaoConta;
import br.pucminas.doapp.model.TipoConta;
import br.pucminas.doapp.model.Usuario;

/** Dados da própria conta. Só a pessoa logada recebe; nunca inclui o hash da senha. */
public record UsuarioResposta(
        String id,
        TipoConta tipo,
        String nome,
        String email,
        String telefone,
        LocalizacaoConta localizacao) {

    public static UsuarioResposta de(Usuario usuario) {
        return new UsuarioResposta(usuario.getId(), usuario.getTipo(), usuario.getNome(), usuario.getEmail(),
                usuario.getTelefone(), usuario.getLocalizacao());
    }
}
