package br.pucminas.doapp.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import br.pucminas.doapp.model.Usuario;

public interface UsuarioRepository extends MongoRepository<Usuario, String> {

    /** O e-mail precisa chegar já normalizado (minúsculas, sem espaços nas pontas). */
    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);
}
