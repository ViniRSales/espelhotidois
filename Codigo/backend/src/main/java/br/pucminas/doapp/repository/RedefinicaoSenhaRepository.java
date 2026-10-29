package br.pucminas.doapp.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import br.pucminas.doapp.model.RedefinicaoSenha;

public interface RedefinicaoSenhaRepository extends MongoRepository<RedefinicaoSenha, String> {

    Optional<RedefinicaoSenha> findByTokenHash(String tokenHash);

    /** Já houve um pedido recente para esta conta? Usado para limitar os e-mails. */
    boolean existsByUsuarioIdAndCriadaEmAfter(String usuarioId, Instant desde);

    /** Depois de usar um link, os outros pedidos pendentes da conta deixam de valer. */
    void deleteByUsuarioId(String usuarioId);
}
