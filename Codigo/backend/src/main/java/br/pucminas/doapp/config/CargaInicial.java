package br.pucminas.doapp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import br.pucminas.doapp.service.CategoriaService;

/** Popula o banco com os dados fixos que a aplicação precisa para funcionar. */
@Component
@Profile("!test")
public class CargaInicial implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CargaInicial.class);

    private final CategoriaService categoriaService;

    public CargaInicial(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @Override
    public void run(String... args) {
        int criadas = categoriaService.criarCategoriasIniciais();
        if (criadas > 0) {
            log.info("Carga inicial: {} categorias criadas", criadas);
        }
    }
}
