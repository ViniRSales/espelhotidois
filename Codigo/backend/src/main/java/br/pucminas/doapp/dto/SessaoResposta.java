package br.pucminas.doapp.dto;

import java.time.Instant;

/** Resposta do cadastro e do login: o token JWT, quando ele expira e os dados da conta. */
public record SessaoResposta(String token, Instant expiraEm, UsuarioResposta usuario) {
}
