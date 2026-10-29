package br.pucminas.doapp.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import br.pucminas.doapp.model.TokenRevogado;

public interface TokenRevogadoRepository extends MongoRepository<TokenRevogado, String> {
}
