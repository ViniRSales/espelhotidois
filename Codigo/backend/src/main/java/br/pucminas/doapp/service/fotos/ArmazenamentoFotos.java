package br.pucminas.doapp.service.fotos;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import br.pucminas.doapp.model.Foto;

/**
 * Onde ficam os arquivos das fotos das doações. Hoje é o disco local ({@link ArmazenamentoLocal});
 * trocar por um serviço externo só exige outra implementação desta interface.
 */
public interface ArmazenamentoFotos {

    /** Valida (tipo e tamanho) e grava a foto; o nome do arquivo é sempre gerado aqui. */
    Foto salvar(String doacaoId, MultipartFile arquivo);

    /** Arquivo da foto; lança 404 se ele não existir. */
    Resource carregar(String doacaoId, String arquivo);

    void remover(String doacaoId, String arquivo);

    /** Apaga todas as fotos de uma doação, por exemplo ao descartar um rascunho. */
    void removerTodas(String doacaoId);
}
