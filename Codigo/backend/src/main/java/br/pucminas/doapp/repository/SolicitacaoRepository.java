package br.pucminas.doapp.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import br.pucminas.doapp.model.Solicitacao;

public interface SolicitacaoRepository extends MongoRepository<Solicitacao, String> {
}
