package br.pucminas.doapp.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Conta de uma pessoa física ou instituição (coleção {@code usuarios}).
 *
 * <p>E-mail, telefone e senha nunca são expostos publicamente (RNF03); a senha só existe como hash BCrypt.
 */
@Document("usuarios")
public class Usuario {

    @Id
    private String id;

    private TipoConta tipo;

    private String nome;

    /** Sempre em minúsculas; o índice único garante um e-mail por conta mesmo com cadastros simultâneos. */
    @Indexed(unique = true)
    private String email;

    /** Só dígitos, com DDD. */
    private String telefone;

    private LocalizacaoConta localizacao;

    private String senhaHash;

    private Instant criadoEm;

    /**
     * Versão das sessões da conta: cada token leva a versão em que foi emitido (claim {@code sv}) e só vale enquanto
     * ela for a atual. Trocar a senha aumenta a versão e encerra todos os tokens anteriores na hora. Um contador
     * não tem o problema de um horário, cuja precisão no JWT é de segundos.
     */
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

    /** Troca a senha e encerra todas as sessões abertas: quem tinha a senha antiga e estava logado perde o acesso. */
    public void redefinirSenha(String novoHash, Instant agora) {
        this.senhaHash = novoHash;
        this.senhaAlteradaEm = agora;
        this.versaoSessao++;
    }
}
