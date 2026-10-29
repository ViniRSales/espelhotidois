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

import br.pucminas.doapp.dto.FotoResposta;
import br.pucminas.doapp.dto.SolicitacaoRequisicao;
import br.pucminas.doapp.dto.SolicitacaoResposta;
import br.pucminas.doapp.service.SolicitacaoService;

@RestController
@RequestMapping("/api/solicitacoes")
public class SolicitacaoController {

    private final SolicitacaoService service;

    public SolicitacaoController(SolicitacaoService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<SolicitacaoResposta> cadastrar(@RequestBody SolicitacaoRequisicao dados) {
        SolicitacaoResposta criada = service.cadastrar(dados);
        return ResponseEntity.created(URI.create("/api/solicitacoes/" + criada.id())).body(criada);
    }

    @GetMapping("/{id}")
    public SolicitacaoResposta buscar(@PathVariable String id) {
        return service.buscar(id);
    }

    @PutMapping("/{id}")
    public SolicitacaoResposta editar(@PathVariable String id, @RequestBody SolicitacaoRequisicao dados) {
        return service.editar(id, dados);
    }

    /** Cancelar é uma ação, não uma exclusão: o pedido continua existindo, só que encerrado. */
    @PostMapping("/{id}/cancelar")
    public SolicitacaoResposta cancelar(@PathVariable String id) {
        return service.cancelar(id);
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
}
