package br.pucminas.doapp.service.fotos;

import java.util.Arrays;
import java.util.Optional;

/**
 * Formatos de foto reconhecidos. O formato é descoberto pelos primeiros bytes do arquivo, e não pelo nome
 * ou pelo tipo declarado no envio, que podem ser trocados.
 */
public enum FormatoImagem {

    JPEG("image/jpeg", "jpg"),
    PNG("image/png", "png"),
    WEBP("image/webp", "webp");

    /** Quantos bytes do início do arquivo bastam para reconhecer qualquer formato. */
    public static final int BYTES_ASSINATURA = 12;

    private final String tipo;
    private final String extensao;

    FormatoImagem(String tipo, String extensao) {
        this.tipo = tipo;
        this.extensao = extensao;
    }

    public String tipo() {
        return tipo;
    }

    public String extensao() {
        return extensao;
    }

    /** Reconhece o formato pelos bytes iniciais: JPEG {@code FF D8 FF}, PNG {@code 89 50 4E 47}, WEBP {@code RIFF....WEBP}. */
    public static Optional<FormatoImagem> detectar(byte[] inicio) {
        if (comeca(inicio, 0, 0xFF, 0xD8, 0xFF)) {
            return Optional.of(JPEG);
        }
        if (comeca(inicio, 0, 0x89, 'P', 'N', 'G')) {
            return Optional.of(PNG);
        }
        if (comeca(inicio, 0, 'R', 'I', 'F', 'F') && comeca(inicio, 8, 'W', 'E', 'B', 'P')) {
            return Optional.of(WEBP);
        }
        return Optional.empty();
    }

    public static Optional<FormatoImagem> porExtensao(String extensao) {
        return Arrays.stream(values()).filter(formato -> formato.extensao.equalsIgnoreCase(extensao)).findFirst();
    }

    private static boolean comeca(byte[] dados, int posicao, int... esperados) {
        if (dados.length < posicao + esperados.length) {
            return false;
        }
        for (int i = 0; i < esperados.length; i++) {
            if ((dados[posicao + i] & 0xFF) != esperados[i]) {
                return false;
            }
        }
        return true;
    }
}
