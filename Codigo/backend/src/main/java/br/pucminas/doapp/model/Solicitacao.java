package br.pucminas.doapp.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Pedido de um receptor: o que ele precisa e para quando (coleção {@code solicitacoes}).
 *
 * <p>Nasce {@link SituacaoSolicitacao#ABERTA} e só pode ser alterada enquanto estiver aberta.
 * A validação e a normalização dos campos ficam no serviço.
 */
@Document("solicitacoes")
public class Solicitacao {

    @Id
    private String id;

    /** Quem fez o pedido. Nunca sai na resposta da API, para não expor o receptor. */
    @Indexed
    private String receptorId;

    private String titulo;
    private String descricao;
    private String categoriaId;
    private Urgencia urgencia;
    private Localizacao localizacao;

    /** Foto opcional que mostra o tipo de item procurado. Usa o mesmo armazenamento das fotos de doação. */
    private List<Foto> fotosReferencia = new ArrayList<>();

    @Indexed
    private SituacaoSolicitacao situacao;

    private Instant dataCadastro;
    private Instant atualizadaEm;

    protected Solicitacao() {
    }

    /** Cria um pedido aberto do usuário informado. */
    public Solicitacao(String receptorId, Instant agora) {
        this.receptorId = receptorId;
        this.situacao = SituacaoSolicitacao.ABERTA;
        this.dataCadastro = agora;
        this.atualizadaEm = agora;
    }

    public boolean ehAberta() {
        return situacao == SituacaoSolicitacao.ABERTA;
    }

    /** Encerra o pedido a pedido do receptor; ele deixa de aparecer para os doadores. */
    public void cancelar(Instant agora) {
        if (!ehAberta()) {
            throw new IllegalStateException("Só um pedido aberto pode ser cancelado.");
        }
        this.situacao = SituacaoSolicitacao.CANCELADA;
        this.atualizadaEm = agora;
    }

    public void registrarAlteracao(Instant agora) {
        this.atualizadaEm = agora;
    }

    public void adicionarFoto(Foto foto) {
        fotosReferencia.add(foto);
    }

    /** Remove a foto e a devolve, para que o arquivo também seja apagado; {@code null} se ela não existir. */
    public Foto removerFoto(String fotoId) {
        Foto foto = fotosReferencia.stream()
                .filter(atual -> atual.id().equals(fotoId))
                .findFirst()
                .orElse(null);
        fotosReferencia.remove(foto);
        return foto;
    }

    public List<Foto> getFotosReferencia() {
        return Collections.unmodifiableList(fotosReferencia);
    }

    public String getId() {
        return id;
    }

    public String getReceptorId() {
        return receptorId;
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

    public String getCategoriaId() {
        return categoriaId;
    }

    public void setCategoriaId(String categoriaId) {
        this.categoriaId = categoriaId;
    }

    public Urgencia getUrgencia() {
        return urgencia;
    }

    public void setUrgencia(Urgencia urgencia) {
        this.urgencia = urgencia;
    }

    public Localizacao getLocalizacao() {
        return localizacao;
    }

    public void setLocalizacao(Localizacao localizacao) {
        this.localizacao = localizacao;
    }

    public SituacaoSolicitacao getSituacao() {
        return situacao;
    }

    public Instant getDataCadastro() {
        return dataCadastro;
    }

    public Instant getAtualizadaEm() {
        return atualizadaEm;
    }
}
