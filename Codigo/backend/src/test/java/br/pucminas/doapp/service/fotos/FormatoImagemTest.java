package br.pucminas.doapp.service.fotos;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class FormatoImagemTest {

    static final byte[] JPEG = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0x10, 'J', 'F', 'I', 'F', 0, 1 };
    static final byte[] PNG = { (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D };
    static final byte[] WEBP = { 'R', 'I', 'F', 'F', 0x24, 0, 0, 0, 'W', 'E', 'B', 'P' };

    @Test
    void reconheceOsFormatosPelosBytesIniciais() {
        assertThat(FormatoImagem.detectar(JPEG)).contains(FormatoImagem.JPEG);
        assertThat(FormatoImagem.detectar(PNG)).contains(FormatoImagem.PNG);
        assertThat(FormatoImagem.detectar(WEBP)).contains(FormatoImagem.WEBP);
    }

    @Test
    void naoReconheceOutrosArquivosNemArquivosCurtos() {
        assertThat(FormatoImagem.detectar("GIF89a......".getBytes())).isEmpty();
        assertThat(FormatoImagem.detectar("RIFF....WAVE".getBytes())).isEmpty();
        assertThat(FormatoImagem.detectar(new byte[] { (byte) 0xFF, (byte) 0xD8 })).isEmpty();
        assertThat(FormatoImagem.detectar(new byte[0])).isEmpty();
    }

    @Test
    void achaOFormatoPelaExtensao() {
        assertThat(FormatoImagem.porExtensao("JPG")).contains(FormatoImagem.JPEG);
        assertThat(FormatoImagem.porExtensao("webp")).contains(FormatoImagem.WEBP);
        assertThat(FormatoImagem.porExtensao("gif")).isEmpty();
        assertThat(FormatoImagem.porExtensao(null)).isEmpty();
    }
}
