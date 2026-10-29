package br.pucminas.doapp.service;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import br.pucminas.doapp.config.SolicitacaoProperties;
import br.pucminas.doapp.dto.CategoriaResposta;
import br.pucminas.doapp.dto.FotoResposta;
import br.pucminas.doapp.dto.SolicitacaoRequisicao;
import br.pucminas.doapp.dto.SolicitacaoResposta;
import br.pucminas.doapp.exception.ConflitoException;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.exception.NaoAutenticadoException;
import br.pucminas.doapp.exception.RecursoNaoEncontradoException;
import br.pucminas.doapp.model.Foto;
import br.pucminas.doapp.model.Solicitacao;
import br.pucminas.doapp.repository.SolicitacaoRepository;
import br.pucminas.doapp.service.fotos.ArmazenamentoFotos;

/**
 * Cadastro de solicitações (pedidos): cadastrar, ver, editar, cancelar e a foto de referência opcional.
 * Qualquer pessoa vê um pedido; só quem o criou pode editá-lo ou cancelá-lo, e só enquanto estiver aberto.
 */
@Service
public class SolicitacaoService {

    private final SolicitacaoRepository repository;
    private final RegrasSolicitacao regras;
    private final CategoriaService categorias;
    private final ArmazenamentoFotos armazenamento;
    private final ControleAcessoService acesso;
    private final SolicitacaoProperties solicitacoes;
    private final Clock relogio;

    public SolicitacaoService(SolicitacaoRepository repository, RegrasSolicitacao regras, CategoriaService categorias,
            ArmazenamentoFotos armazenamento, ControleAcessoService acesso, SolicitacaoProperties solicitacoes,
            Clock relogio) {
        this.repository = repository;
        this.regras = regras;
        this.categorias = categorias;
        this.armazenamento = armazenamento;
        this.acesso = acesso;
        this.solicitacoes = solicitacoes;
        this.relogio = relogio;
    }

    public SolicitacaoResposta cadastrar(SolicitacaoRequisicao dados) {
        var solicitacao = new Solicitacao(acesso.idUsuarioAtual(), agora());
        regras.aplicar(solicitacao, dados);
        return resposta(repository.save(solicitacao));
    }

    /** Pedido de qualquer pessoa, sem login. */
    public SolicitacaoResposta buscar(String id) {
        return resposta(encontrar(id));
    }

    public SolicitacaoResposta editar(String id, SolicitacaoRequisicao dados) {
        Solicitacao solicitacao = abertaDoUsuario(id);
        regras.aplicar(solicitacao, dados);
        solicitacao.registrarAlteracao(agora());
        return resposta(repository.save(solicitacao));
    }

    public SolicitacaoResposta cancelar(String id) {
        Solicitacao solicitacao = abertaDoUsuario(id);
        solicitacao.cancelar(agora());
        return resposta(repository.save(solicitacao));
    }

    /** Grava a foto de referência na pasta do pedido, no mesmo armazenamento das fotos de doação. */
    public FotoResposta adicionarFoto(String id, MultipartFile arquivo) {
        Solicitacao solicitacao = abertaDoUsuario(id);
        int maximo = solicitacoes.fotosMaximo();
        if (solicitacao.getFotosReferencia().size() >= maximo) {
            throw new DadosInvalidosException("fotos",
                    maximo == 1 ? "Você já adicionou uma foto. Remova-a para escolher outra."
                            : "Você já adicionou o máximo de %d fotos.".formatted(maximo));
        }

        Foto foto = armazenamento.salvar(solicitacao.getId(), arquivo);
        solicitacao.adicionarFoto(foto);
        solicitacao.registrarAlteracao(agora());
        try {
            repository.save(solicitacao);
        } catch (RuntimeException e) {
            armazenamento.remover(solicitacao.getId(), foto.arquivo());
            throw e;
        }
        return FotoResposta.de(solicitacao.getId(), foto);
    }

    public void removerFoto(String id, String fotoId) {
        Solicitacao solicitacao = abertaDoUsuario(id);
        Foto foto = solicitacao.removerFoto(fotoId);
        if (foto == null) {
            throw new RecursoNaoEncontradoException("Foto não encontrada.");
        }
        solicitacao.registrarAlteracao(agora());
        repository.save(solicitacao);
        armazenamento.remover(solicitacao.getId(), foto.arquivo());
    }

    private Solicitacao abertaDoUsuario(String id) {
        Solicitacao solicitacao = encontrar(id);
        acesso.garantirDono(solicitacao.getReceptorId());
        if (!solicitacao.ehAberta()) {
            throw new ConflitoException("Este pedido já foi encerrado e não pode mais ser alterado.");
        }
        return solicitacao;
    }

    private Solicitacao encontrar(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado."));
    }

    private SolicitacaoResposta resposta(Solicitacao solicitacao) {
        CategoriaResposta categoria = categorias.procurar(solicitacao.getCategoriaId())
                .map(CategoriaResposta::de)
                .orElse(null);
        return SolicitacaoResposta.de(solicitacao, categoria, ehDono(solicitacao));
    }

    /** Quem não está logado só vê o pedido; para essa pessoa, {@code souDono} é sempre falso. */
    private boolean ehDono(Solicitacao solicitacao) {
        try {
            return acesso.ehDono(solicitacao.getReceptorId());
        } catch (NaoAutenticadoException e) {
            return false;
        }
    }

    private Instant agora() {
        return Instant.now(relogio);
    }
}
