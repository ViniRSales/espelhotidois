package br.pucminas.doapp.model;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Item que um doador disponibiliza (coleção {@code doacoes}).
 *
 * <p>Nasce como {@link SituacaoDoacao#RASCUNHO}, com os campos ainda incompletos, e só é validada por inteiro
 * ao ser publicada. A validação e a normalização dos campos ficam no serviço.
 */
@Document("doacoes")
public class Doacao {

    @Id
    private String id;

    @Indexed
    private String doadorId;

    private String titulo;
    private String descricao;
    private List<Foto> fotos = new ArrayList<>();
    private String categoriaId;
    private List<String> tags = new ArrayList<>();
    private Condicao condicao;
    private Set<FormaEntrega> formasEntrega = new HashSet<>();

    /** Só para alimentos: data de validade, obrigatória quando o item não é marcado como não perecível. */
    private LocalDate validade;
    private Boolean naoPerecivel;

    private Localizacao localizacao;

    @Indexed
    private SituacaoDoacao situacao;

    private Instant dataCadastro;
    private Instant atualizadaEm;
    private Instant publicadaEm;
    private Instant expiraEm;

    protected Doacao() {
    }

    /** Cria o rascunho de uma doação do usuário informado. */
    public Doacao(String doadorId, Instant agora) {
        this.doadorId = doadorId;
        this.situacao = SituacaoDoacao.RASCUNHO;
        this.dataCadastro = agora;
        this.atualizadaEm = agora;
    }

    public boolean ehRascunho() {
        return situacao == SituacaoDoacao.RASCUNHO;
    }

    /** Torna o rascunho disponível pelo prazo informado. */
    public void publicar(Instant agora, Duration prazo) {
        if (!ehRascunho()) {
            throw new IllegalStateException("Só um rascunho pode ser publicado.");
        }
        this.situacao = SituacaoDoacao.DISPONIVEL;
        this.publicadaEm = agora;
        this.expiraEm = agora.plus(prazo);
        this.atualizadaEm = agora;
    }

    /** Desativa uma doação disponível cujo prazo terminou. */
    public void expirar(Instant agora) {
        if (situacao != SituacaoDoacao.DISPONIVEL) {
            throw new IllegalStateException("Só uma doação disponível pode expirar.");
        }
        this.situacao = SituacaoDoacao.EXPIRADA;
        this.atualizadaEm = agora;
    }

    public void registrarAlteracao(Instant agora) {
        this.atualizadaEm = agora;
    }

    public void adicionarFoto(Foto foto) {
        fotos.add(foto);
    }

    /** Remove a foto e a devolve, para que o arquivo também seja apagado. */
    public Foto removerFoto(String fotoId) {
        Foto foto = buscarFoto(fotoId);
        fotos.remove(foto);
        return foto;
    }

    public Foto buscarFoto(String fotoId) {
        return fotos.stream()
                .filter(foto -> foto.id().equals(fotoId))
                .findFirst()
                .orElse(null);
    }

    /**
     * Reordena as fotos pela lista de ids; a primeira vira a capa.
     * Ids desconhecidos são ignorados e as fotos que não aparecem na lista vão para o fim, na ordem atual.
     */
    public void reordenarFotos(List<String> ordem) {
        fotos.sort(Comparator.comparingInt(foto -> {
            int posicao = ordem.indexOf(foto.id());
            return posicao < 0 ? Integer.MAX_VALUE : posicao;
        }));
    }

    public String getId() {
        return id;
    }

    public String getDoadorId() {
        return doadorId;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public List<Foto> getFotos() {
        return Collections.unmodifiableList(fotos);
    }

    public String getCategoriaId() {
        return categoriaId;
    }

    public void setCategoriaId(String categoriaId) {
        this.categoriaId = categoriaId;
    }

    public List<String> getTags() {
        return Collections.unmodifiableList(tags);
    }

    public void setTags(List<String> tags) {
        this.tags = new ArrayList<>(tags);
    }

    public Condicao getCondicao() {
        return condicao;
    }

    public void setCondicao(Condicao condicao) {
        this.condicao = condicao;
    }

    public Set<FormaEntrega> getFormasEntrega() {
        return Collections.unmodifiableSet(formasEntrega);
    }

    public void setFormasEntrega(Set<FormaEntrega> formasEntrega) {
        this.formasEntrega = new HashSet<>(formasEntrega);
    }

    public LocalDate getValidade() {
        return validade;
    }

    public void setValidade(LocalDate validade) {
        this.validade = validade;
    }

    public Boolean getNaoPerecivel() {
        return naoPerecivel;
    }

    public void setNaoPerecivel(Boolean naoPerecivel) {
        this.naoPerecivel = naoPerecivel;
    }

    public Localizacao getLocalizacao() {
        return localizacao;
    }

    public void setLocalizacao(Localizacao localizacao) {
        this.localizacao = localizacao;
    }

    public SituacaoDoacao getSituacao() {
        return situacao;
    }

    public Instant getDataCadastro() {
        return dataCadastro;
    }

    public Instant getAtualizadaEm() {
        return atualizadaEm;
    }

    public Instant getPublicadaEm() {
        return publicadaEm;
    }

    public Instant getExpiraEm() {
        return expiraEm;
    }
}
