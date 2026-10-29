package br.pucminas.doapp.service.fotos;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.unit.DataSize;

import br.pucminas.doapp.config.DoacaoProperties;
import br.pucminas.doapp.exception.ArquivoMuitoGrandeException;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.exception.RecursoNaoEncontradoException;
import br.pucminas.doapp.model.Foto;

class ArmazenamentoLocalTest {

    private static final String DOACAO = "doacao-1";

    @TempDir
    private Path diretorio;

    private ArmazenamentoLocal armazenamento;

    @BeforeEach
    void criarArmazenamento() {
        var fotos = new DoacaoProperties.Fotos(diretorio, 1, 10, DataSize.ofBytes(1024),
                List.of("image/jpeg", "image/png", "image/webp"));
        armazenamento = new ArmazenamentoLocal(new DoacaoProperties(30, "0 0 3 * * *", 90, 300, 5, fotos));
    }

    @Test
    void salvaComNomeGeradoECarregaAFoto() throws Exception {
        byte[] conteudo = imagem(FormatoImagemTest.PNG, 100);

        Foto foto = armazenamento.salvar(DOACAO, arquivo("../../meu gato.png", "image/png", conteudo));

        assertThat(foto.tipo()).isEqualTo("image/png");
        assertThat(foto.tamanho()).isEqualTo(100);
        assertThat(foto.arquivo()).isEqualTo(foto.id() + ".png");
        assertThat(diretorio.resolve(DOACAO).resolve(foto.arquivo())).hasBinaryContent(conteudo);
        assertThat(armazenamento.carregar(DOACAO, foto.arquivo()).getContentAsByteArray()).isEqualTo(conteudo);
    }

    @Test
    void usaOFormatoDosBytesENaoODeclarado() {
        Foto foto = armazenamento.salvar(DOACAO, arquivo("foto.png", "image/png", imagem(FormatoImagemTest.JPEG, 50)));

        assertThat(foto.tipo()).isEqualTo("image/jpeg");
        assertThat(foto.arquivo()).endsWith(".jpg");
    }

    @Test
    void recusaArquivoQueNaoEhFotoMesmoComNomeDeFoto() {
        var falso = arquivo("foto.jpg", "image/jpeg", "<script>alert(1)</script>".getBytes());

        assertThatThrownBy(() -> armazenamento.salvar(DOACAO, falso))
                .isInstanceOf(DadosInvalidosException.class)
                .extracting(ex -> ((DadosInvalidosException) ex).getCampos().getFirst().campo())
                .isEqualTo("arquivo");
        assertThat(diretorio.resolve(DOACAO)).doesNotExist();
    }

    @Test
    void recusaFormatoForaDosPermitidos() {
        var fotos = new DoacaoProperties.Fotos(diretorio, 1, 10, DataSize.ofBytes(1024), List.of("image/jpeg"));
        var soJpeg = new ArmazenamentoLocal(new DoacaoProperties(30, "0 0 3 * * *", 90, 300, 5, fotos));

        assertThatThrownBy(() -> soJpeg.salvar(DOACAO, arquivo("a.png", "image/png", imagem(FormatoImagemTest.PNG, 50))))
                .isInstanceOf(DadosInvalidosException.class);
    }

    @Test
    void recusaArquivoVazioEArquivoGrandeDemais() {
        assertThatThrownBy(() -> armazenamento.salvar(DOACAO, arquivo("a.jpg", "image/jpeg", new byte[0])))
                .isInstanceOf(DadosInvalidosException.class);
        assertThatThrownBy(() -> armazenamento.salvar(DOACAO, arquivo("a.jpg", "image/jpeg", imagem(FormatoImagemTest.JPEG, 1025))))
                .isInstanceOf(ArquivoMuitoGrandeException.class);
    }

    @Test
    void naoDeixaSairDoDiretorio() throws Exception {
        Files.writeString(diretorio.getParent().resolve("segredo.txt"), "x");

        assertThatThrownBy(() -> armazenamento.carregar("..", "segredo.txt")).isInstanceOf(RecursoNaoEncontradoException.class);
        assertThatThrownBy(() -> armazenamento.carregar(DOACAO, "../../segredo.txt")).isInstanceOf(RecursoNaoEncontradoException.class);
        assertThatThrownBy(() -> armazenamento.removerTodas("../x")).isInstanceOf(RecursoNaoEncontradoException.class);
    }

    @Test
    void fotoInexistenteDa404() {
        assertThatThrownBy(() -> armazenamento.carregar(DOACAO, "nao-existe.jpg"))
                .isInstanceOf(RecursoNaoEncontradoException.class);
    }

    @Test
    void removeUmaFotoETodasAsFotosDaDoacao() {
        Foto primeira = armazenamento.salvar(DOACAO, arquivo("a.jpg", "image/jpeg", imagem(FormatoImagemTest.JPEG, 20)));
        Foto segunda = armazenamento.salvar(DOACAO, arquivo("b.jpg", "image/jpeg", imagem(FormatoImagemTest.JPEG, 20)));

        armazenamento.remover(DOACAO, primeira.arquivo());

        assertThat(diretorio.resolve(DOACAO).resolve(primeira.arquivo())).doesNotExist();
        assertThat(diretorio.resolve(DOACAO).resolve(segunda.arquivo())).exists();

        armazenamento.removerTodas(DOACAO);
        armazenamento.removerTodas("doacao-sem-fotos");

        assertThat(diretorio.resolve(DOACAO)).doesNotExist();
    }

    /** Arquivo com a assinatura do formato seguida de bytes quaisquer, até o tamanho pedido. */
    private static byte[] imagem(byte[] assinatura, int tamanho) {
        return Arrays.copyOf(assinatura, tamanho);
    }

    private static MockMultipartFile arquivo(String nome, String tipo, byte[] conteudo) {
        return new MockMultipartFile("arquivo", nome, tipo, conteudo);
    }
}
