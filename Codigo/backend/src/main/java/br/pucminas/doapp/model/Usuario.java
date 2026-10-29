package br.pucminas.doapp.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("usuarios")
public class Usuario {

    @Id
    private String id;

    private TipoConta tipo;

    private String nome;

    @Indexed(unique = true)
    private String email;

    private String telefone;

    private LocalizacaoConta localizacao;

    private String senhaHash;

    private Instant criadoEm;

    private int versaoSessao;

    private Instant senhaAlteradaEm;

    protected Usuario() {
    }

    public Usuario(TipoConta tipo, String nome, String email, String telefone, LocalizacaoConta localizacao,
            String senhaHash, Instant criadoEm) {
        this.tipo = tipo;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.localizacao = localizacao;
        this.senhaHash = senhaHash;
        this.criadoEm = criadoEm;
    }

    public String getId() {
        return id;
    }

    public TipoConta getTipo() {
        return tipo;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public String getTelefone() {
        return telefone;
    }

    public LocalizacaoConta getLocalizacao() {
        return localizacao;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public int getVersaoSessao() {
        return versaoSessao;
    }

    public Instant getSenhaAlteradaEm() {
        return senhaAlteradaEm;
    }

    public void redefinirSenha(String novoHash, Instant agora) {
        this.senhaHash = novoHash;
        this.senhaAlteradaEm = agora;
        this.versaoSessao++;
    }
}
