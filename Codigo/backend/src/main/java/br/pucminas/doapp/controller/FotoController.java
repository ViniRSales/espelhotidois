package br.pucminas.doapp.controller;

import java.time.Duration;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.pucminas.doapp.service.fotos.ArmazenamentoFotos;
import br.pucminas.doapp.service.fotos.FormatoImagem;

/** Serve os arquivos das fotos das doações. A leitura é pública, como o resto do {@code GET /api/**}. */
@RestController
@RequestMapping("/api/fotos")
public class FotoController {

    /** O nome de cada foto é único e nunca é reaproveitado, então o navegador pode guardá-la por muito tempo. */
    private static final CacheControl CACHE = CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable();

    private final ArmazenamentoFotos armazenamento;

    public FotoController(ArmazenamentoFotos armazenamento) {
        this.armazenamento = armazenamento;
    }

    @GetMapping("/{doacaoId}/{arquivo}")
    public ResponseEntity<Resource> carregar(@PathVariable String doacaoId, @PathVariable String arquivo) {
        Resource foto = armazenamento.carregar(doacaoId, arquivo);
        MediaType tipo = FormatoImagem.porExtensao(StringUtils.getFilenameExtension(arquivo))
                .map(formato -> MediaType.parseMediaType(formato.tipo()))
                .orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok().contentType(tipo).cacheControl(CACHE).body(foto);
    }
}
