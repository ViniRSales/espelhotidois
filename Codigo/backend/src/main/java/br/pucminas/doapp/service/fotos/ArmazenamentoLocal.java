package br.pucminas.doapp.service.fotos;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import br.pucminas.doapp.config.DoacaoProperties;
import br.pucminas.doapp.exception.ArquivoMuitoGrandeException;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.exception.RecursoNaoEncontradoException;
import br.pucminas.doapp.model.Foto;

/**
 * Grava as fotos no disco, em {@code doapp.doacoes.fotos.diretorio}/{id da doação}/{id da foto}.{extensão}.
 * Os nomes de pasta e arquivo só aceitam letras, números e hífen, para que nenhum caminho saia do diretório.
 */
@Service
public class ArmazenamentoLocal implements ArmazenamentoFotos {

    private static final Pattern ID_SEGURO = Pattern.compile("[A-Za-z0-9-]+");
    private static final Pattern ARQUIVO_SEGURO = Pattern.compile("[A-Za-z0-9-]+\\.[a-z]+");

    private final DoacaoProperties.Fotos regras;
    private final Path raiz;

    public ArmazenamentoLocal(DoacaoProperties doacoes) {
        this.regras = doacoes.fotos();
        this.raiz = regras.diretorio().toAbsolutePath().normalize();
    }

    @Override
    public Foto salvar(String doacaoId, MultipartFile arquivo) {
        if (arquivo.isEmpty()) {
            throw new DadosInvalidosException("arquivo", "Escolha uma foto para enviar.");
        }
        if (arquivo.getSize() > regras.tamanhoMaximo().toBytes()) {
            throw new ArquivoMuitoGrandeException("Esta foto passa de %d MB. Escolha uma foto menor."
                    .formatted(regras.tamanhoMaximo().toMegabytes()));
        }

        FormatoImagem formato = FormatoImagem.detectar(lerInicio(arquivo))
                .filter(f -> regras.tiposPermitidos().contains(f.tipo()))
                .orElseThrow(() -> new DadosInvalidosException("arquivo", "Envie fotos em JPG, PNG ou WEBP."));

        String id = UUID.randomUUID().toString();
        String nome = id + "." + formato.extensao();
        Path destino = caminho(doacaoId, nome);
        try (InputStream entrada = arquivo.getInputStream()) {
            Files.createDirectories(destino.getParent());
            Files.copy(entrada, destino);
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível gravar a foto " + destino, e);
        }
        return new Foto(id, nome, formato.tipo(), arquivo.getSize());
    }

    @Override
    public Resource carregar(String doacaoId, String arquivo) {
        Path caminho = caminho(doacaoId, arquivo);
        if (!Files.isRegularFile(caminho)) {
            throw new RecursoNaoEncontradoException("Foto não encontrada.");
        }
        return new FileSystemResource(caminho);
    }

    @Override
    public void remover(String doacaoId, String arquivo) {
        try {
            Files.deleteIfExists(caminho(doacaoId, arquivo));
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível apagar a foto " + arquivo, e);
        }
    }

    @Override
    public void removerTodas(String doacaoId) {
        Path pasta = pasta(doacaoId);
        if (!Files.isDirectory(pasta)) {
            return;
        }
        try (Stream<Path> caminhos = Files.walk(pasta)) {
            for (Path caminho : caminhos.sorted(Comparator.reverseOrder()).toList()) {
                Files.delete(caminho);
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível apagar as fotos da doação " + doacaoId, e);
        }
    }

    private byte[] lerInicio(MultipartFile arquivo) {
        try (InputStream entrada = arquivo.getInputStream()) {
            return entrada.readNBytes(FormatoImagem.BYTES_ASSINATURA);
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível ler a foto enviada", e);
        }
    }

    private Path pasta(String doacaoId) {
        if (doacaoId == null || !ID_SEGURO.matcher(doacaoId).matches()) {
            throw new RecursoNaoEncontradoException("Foto não encontrada.");
        }
        return dentroDaRaiz(raiz.resolve(doacaoId));
    }

    private Path caminho(String doacaoId, String arquivo) {
        if (arquivo == null || !ARQUIVO_SEGURO.matcher(arquivo).matches()) {
            throw new RecursoNaoEncontradoException("Foto não encontrada.");
        }
        return dentroDaRaiz(pasta(doacaoId).resolve(arquivo));
    }

    /** Segunda barreira contra caminhos fora do diretório, além dos padrões de nome. */
    private Path dentroDaRaiz(Path caminho) {
        Path normalizado = caminho.normalize();
        if (!normalizado.startsWith(raiz)) {
            throw new RecursoNaoEncontradoException("Foto não encontrada.");
        }
        return normalizado;
    }
}
