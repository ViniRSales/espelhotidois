package br.pucminas.doapp.controller;

import java.net.URI;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.pucminas.doapp.dto.DoacaoRascunhoRequisicao;
import br.pucminas.doapp.dto.DoacaoResposta;
import br.pucminas.doapp.dto.FotoResposta;
import br.pucminas.doapp.service.DoacaoService;

@RestController
@RequestMapping("/api/doacoes")
public class DoacaoController {

    private final DoacaoService service;

    public DoacaoController(DoacaoService service) {
        this.service = service;
    }

    /** Rascunho do usuário logado, ou 204 se ele não tiver nenhum. */
    @GetMapping("/rascunho")
    public ResponseEntity<DoacaoResposta> buscarRascunho() {
        return service.buscarRascunho()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping
    public ResponseEntity<DoacaoResposta> criarRascunho(@RequestBody DoacaoRascunhoRequisicao dados) {
        DoacaoResposta criada = service.criarRascunho(dados);
        return ResponseEntity.created(URI.create("/api/doacoes/" + criada.id())).body(criada);
    }

    @GetMapping("/{id}")
    public DoacaoResposta buscar(@PathVariable String id) {
        return service.buscar(id);
    }

    @PutMapping("/{id}")
    public DoacaoResposta atualizarRascunho(@PathVariable String id, @RequestBody DoacaoRascunhoRequisicao dados) {
        return service.atualizarRascunho(id, dados);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void descartarRascunho(@PathVariable String id) {
        service.descartarRascunho(id);
    }

    @PostMapping(path = "/{id}/fotos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public FotoResposta adicionarFoto(@PathVariable String id, @RequestParam("arquivo") MultipartFile arquivo) {
        return service.adicionarFoto(id, arquivo);
    }

    @DeleteMapping("/{id}/fotos/{fotoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removerFoto(@PathVariable String id, @PathVariable String fotoId) {
        service.removerFoto(id, fotoId);
    }

    @PostMapping("/{id}/publicar")
    public DoacaoResposta publicar(@PathVariable String id) {
        return service.publicar(id);
    }
}
