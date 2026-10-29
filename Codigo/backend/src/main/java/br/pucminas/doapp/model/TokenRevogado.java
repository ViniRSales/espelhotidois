package br.pucminas.doapp.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("tokens_revogados")
public class TokenRevogado {

    @Id
    private String id;

    @Indexed(expireAfter = "0s")
    private Instant expiraEm;

    protected TokenRevogado() {
    }

    public TokenRevogado(String id, Instant expiraEm) {
        this.id = id;
        this.expiraEm = expiraEm;
    }

    public String getId() {
        return id;
    }

    public Instant getExpiraEm() {
        return expiraEm;
    }
}
