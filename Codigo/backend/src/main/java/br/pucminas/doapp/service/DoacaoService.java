package br.pucminas.doapp.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import br.pucminas.doapp.config.DoacaoProperties;
import br.pucminas.doapp.dto.CategoriaResposta;
import br.pucminas.doapp.dto.DoacaoRascunhoRequisicao;
import br.pucminas.doapp.dto.DoacaoResposta;
import br.pucminas.doapp.dto.FotoResposta;
import br.pucminas.doapp.exception.ConflitoException;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.exception.RecursoNaoEncontradoException;
import br.pucminas.doapp.model.Doacao;
import br.pucminas.doapp.model.Foto;
import br.pucminas.doapp.model.SituacaoDoacao;
import br.pucminas.doapp.repository.DoacaoRepository;
import br.pucminas.doapp.service.fotos.ArmazenamentoFotos;

/**
 * Cadastro de doações: o rascunho (um por usuário), suas fotos e a publicação.
 * Só quem criou o rascunho pode vê-lo ou alterá-lo; depois de publicada, a doação não muda mais por aqui.
 */
@Service
public class DoacaoService {

    private final DoacaoRepository repository;
    private final RegrasDoacao regras;
    private final CategoriaService categorias;
    private final ArmazenamentoFotos armazenamento;
    private final ControleAcessoService acesso;
    private final DoacaoProperties doacoes;
    private final Clock relogio;

    public DoacaoService(DoacaoRepository repository, RegrasDoacao regras, CategoriaService categorias,
            ArmazenamentoFotos armazenamento, ControleAcessoService acesso, DoacaoProperties doacoes, Clock relogio) {
        this.repository = repository;
        this.regras = regras;
        this.categorias = categorias;
        this.armazenamento = armazenamento;
        this.acesso = acesso;
        this.doacoes = doacoes;
        this.relogio = relogio;
    }

    /** Rascunho do usuário logado, se houver. */
    public Optional<DoacaoResposta> buscarRascunho() {
        return repository.findFirstByDoadorIdAndSituacao(acesso.idUsuarioAtual(), SituacaoDoacao.RASCUNHO)
                .map(this::resposta);
    }

    public DoacaoResposta criarRascunho(DoacaoRascunhoRequisicao dados) {
        String doadorId = acesso.idUsuarioAtual();
        if (repository.findFirstByDoadorIdAndSituacao(doadorId, SituacaoDoacao.RASCUNHO).isPresent()) {
            throw new ConflitoException("Você já tem um rascunho. Continue de onde parou ou descarte-o para começar outro.");
        }
        var doacao = new Doacao(doadorId, agora());
        regras.aplicarRascunho(doacao, dados);
        return resposta(repository.save(doacao));
    }

    public DoacaoResposta atualizarRascunho(String id, DoacaoRascunhoRequisicao dados) {
        Doacao doacao = rascunhoDoUsuario(id);
        regras.aplicarRascunho(doacao, dados);
        doacao.registrarAlteracao(agora());
        return resposta(repository.save(doacao));
    }

    /** Apaga o rascunho e as fotos dele. */
    public void descartarRascunho(String id) {
        Doacao doacao = rascunhoDoUsuario(id);
        repository.delete(doacao);
        armazenamento.removerTodas(doacao.getId());
    }

    public FotoResposta adicionarFoto(String id, MultipartFile arquivo) {
        Doacao doacao = rascunhoDoUsuario(id);
        int maximo = doacoes.fotos().maximo();
        if (doacao.getFotos().size() >= maximo) {
            throw new DadosInvalidosException("fotos", "Você já adicionou o máximo de %d fotos.".formatted(maximo));
        }

        Foto foto = armazenamento.salvar(doacao.getId(), arquivo);
        doacao.adicionarFoto(foto);
        doacao.registrarAlteracao(agora());
        try {
            repository.save(doacao);
        } catch (RuntimeException e) {
            armazenamento.remover(doacao.getId(), foto.arquivo());
            throw e;
        }
        return FotoResposta.de(doacao.getId(), foto);
    }

    public void removerFoto(String id, String fotoId) {
        Doacao doacao = rascunhoDoUsuario(id);
        Foto foto = doacao.removerFoto(fotoId);
        if (foto == null) {
            throw new RecursoNaoEncontradoException("Foto não encontrada.");
        }
        doacao.registrarAlteracao(agora());
        repository.save(doacao);
        armazenamento.remover(doacao.getId(), foto.arquivo());
    }

    /** Confere o rascunho por inteiro e o torna disponível pelo prazo configurado. */
    public DoacaoResposta publicar(String id) {
        Doacao doacao = rascunhoDoUsuario(id);
        regras.validarPublicacao(doacao);
        doacao.publicar(agora(), doacoes.prazoDisponivel());
        return resposta(repository.save(doacao));
    }

    /** Doação publicada (qualquer pessoa) ou rascunho (só quem o criou; para os demais, ele não existe). */
    public DoacaoResposta buscar(String id) {
        Doacao doacao = repository.findById(id).orElseThrow(DoacaoService::naoEncontrada);
        if (doacao.ehRascunho() && !acesso.ehDono(doacao.getDoadorId())) {
            throw naoEncontrada();
        }
        return resposta(doacao);
    }

    private Doacao rascunhoDoUsuario(String id) {
        Doacao doacao = repository.findById(id).orElseThrow(DoacaoService::naoEncontrada);
        acesso.garantirDono(doacao.getDoadorId());
        if (!doacao.ehRascunho()) {
            throw new ConflitoException("Esta doação já foi publicada e não pode mais ser alterada.");
        }
        return doacao;
    }

    private DoacaoResposta resposta(Doacao doacao) {
        CategoriaResposta categoria = categorias.procurar(doacao.getCategoriaId())
                .map(CategoriaResposta::de)
                .orElse(null);
        return DoacaoResposta.de(doacao, categoria);
    }

    private Instant agora() {
        return Instant.now(relogio);
    }

    private static RecursoNaoEncontradoException naoEncontrada() {
        return new RecursoNaoEncontradoException("Doação não encontrada.");
    }
}
