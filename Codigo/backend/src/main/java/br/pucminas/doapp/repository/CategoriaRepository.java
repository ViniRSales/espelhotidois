package br.pucminas.doapp.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import br.pucminas.doapp.model.Categoria;

public interface CategoriaRepository extends MongoRepository<Categoria, String> {

    List<Categoria> findAllByOrderByNomeAsc();

    boolean existsByNome(String nome);
}
