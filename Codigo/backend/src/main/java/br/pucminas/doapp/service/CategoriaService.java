package br.pucminas.doapp.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import br.pucminas.doapp.dto.CategoriaResposta;
import br.pucminas.doapp.exception.RecursoNaoEncontradoException;
import br.pucminas.doapp.model.Categoria;
import br.pucminas.doapp.repository.CategoriaRepository;

@Service
public class CategoriaService {

    /** Categoria cujos itens exigem validade (ou a marcação de não perecível). */
    public static final String ALIMENTOS = "Alimentos";

    /** Categorias criadas na primeira vez que a API sobe. */
    static final List<String> CATEGORIAS_INICIAIS = List.of(
            "Roupas",
            "Calçados",
            "Acessórios",
            "Bebê e gestante",
            "Brinquedos",
            "Livros e material escolar",
            "Móveis",
            "Eletrodomésticos",
            "Eletrônicos",
            "Utensílios de cozinha",
            "Cama, mesa e banho",
            ALIMENTOS,
            "Higiene e limpeza",
            "Outros");

    private final CategoriaRepository repository;

    public CategoriaService(CategoriaRepository repository) {
        this.repository = repository;
    }

    public List<CategoriaResposta> listar() {
        return repository.findAllByOrderByNomeAsc().stream()
                .map(CategoriaResposta::de)
                .toList();
    }

    public Categoria buscar(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria não encontrada."));
    }

    /** Como {@link #buscar(String)}, mas sem erro: para quem precisa tratar a categoria inexistente. */
    public Optional<Categoria> procurar(String id) {
        return id == null ? Optional.empty() : repository.findById(id);
    }

    /** Cria só as categorias iniciais que ainda não existem; pode rodar várias vezes. */
    public int criarCategoriasIniciais() {
        List<Categoria> faltando = CATEGORIAS_INICIAIS.stream()
                .filter(nome -> !repository.existsByNome(nome))
                .map(Categoria::new)
                .toList();
        repository.saveAll(faltando);
        return faltando.size();
    }
}
