package br.pucminas.doapp.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import br.pucminas.doapp.model.RedefinicaoSenha;

public interface RedefinicaoSenhaRepository extends MongoRepository<RedefinicaoSenha, String> {

    Optional<RedefinicaoSenha> findByTokenHash(String tokenHash);

    boolean existsByUsuarioIdAndCriadaEmAfter(String usuarioId, Instant desde);

    void deleteByUsuarioId(String usuarioId);
}
