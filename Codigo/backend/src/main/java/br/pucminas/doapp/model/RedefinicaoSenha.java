package br.pucminas.doapp.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Pedido de "esqueci minha senha" (coleção {@code redefinicoes_senha}). Guarda só o SHA-256 do token enviado
 * por e-mail: quem ler o banco não consegue usar o link. O índice TTL apaga o pedido quando ele vence.
 */
@Document("redefinicoes_senha")
public class RedefinicaoSenha {

    @Id
    private String id;

    @Indexed
    private String usuarioId;

    @Indexed(unique = true)
    private String tokenHash;

    private Instant criadaEm;

    @Indexed(expireAfter = "0s")
    private Instant expiraEm;

    protected RedefinicaoSenha() {
    }

    public RedefinicaoSenha(String usuarioId, String tokenHash, Instant criadaEm, Instant expiraEm) {
        this.usuarioId = usuarioId;
        this.tokenHash = tokenHash;
        this.criadaEm = criadaEm;
        this.expiraEm = expiraEm;
    }

    /** O TTL do Mongo roda a cada minuto; por isso a validade também é conferida aqui. */
    public boolean venceu(Instant agora) {
        return !agora.isBefore(expiraEm);
    }

    public String getId() {
        return id;
    }

    public String getUsuarioId() {
        return usuarioId;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public Instant getCriadaEm() {
        return criadaEm;
    }

    public Instant getExpiraEm() {
        return expiraEm;
    }
}
