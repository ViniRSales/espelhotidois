package br.pucminas.doapp.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/** Categoria usada para classificar doações e solicitações (coleção {@code categorias}). */
@Document("categorias")
public class Categoria {

    @Id
    private String id;

    @Indexed(unique = true)
    private String nome;

    protected Categoria() {
    }

    public Categoria(String nome) {
        this.nome = nome;
    }

    public String getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }
}
