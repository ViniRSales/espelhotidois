package br.pucminas.doapp.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import br.pucminas.doapp.model.Doacao;
import br.pucminas.doapp.model.SituacaoDoacao;

public interface DoacaoRepository extends MongoRepository<Doacao, String> {

    /** Usado para achar o rascunho do usuário (há no máximo um). */
    Optional<Doacao> findFirstByDoadorIdAndSituacao(String doadorId, SituacaoDoacao situacao);

    /** Usado pela expiração: doações numa situação com prazo vencido. */
    List<Doacao> findBySituacaoAndExpiraEmBefore(SituacaoDoacao situacao, Instant agora);
}
