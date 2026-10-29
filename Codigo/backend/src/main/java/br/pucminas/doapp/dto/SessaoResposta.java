package br.pucminas.doapp.dto;

import java.time.Instant;

public record SessaoResposta(String token, Instant expiraEm, UsuarioResposta usuario) {
}
