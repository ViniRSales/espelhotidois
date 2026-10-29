package br.pucminas.doapp.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

import br.pucminas.doapp.exception.MuitasTentativasException;

class LimiteTentativasTest {

    static final Duration JANELA = Duration.ofMinutes(15);

    /** Relógio que o teste avança à mão. */
    static class RelogioManual extends Clock {
        Instant agora = Instant.parse("2026-10-28T12:00:00Z");

        @Override
        public Instant instant() {
            return agora;
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zona) {
            return this;
        }
    }

    private final RelogioManual relogio = new RelogioManual();
    private final LimiteTentativas limite = new LimiteTentativas(relogio);

    private void conferir() {
        limite.conferir("login:1.2.3.4", 3, JANELA, "Calma");
    }

    @Test
    void barraQuandoChegaAoMaximoDentroDaJanela() {
        for (int i = 0; i < 3; i++) {
            assertThatCode(this::conferir).doesNotThrowAnyException();
            limite.registrar("login:1.2.3.4", JANELA);
        }

        assertThatThrownBy(this::conferir).isInstanceOf(MuitasTentativasException.class).hasMessage("Calma");
    }

    @Test
    void asTentativasVencemDepoisDaJanela() {
        for (int i = 0; i < 3; i++) {
            limite.registrar("login:1.2.3.4", JANELA);
        }

        relogio.agora = relogio.agora.plus(JANELA).plusSeconds(1);

        assertThatCode(this::conferir).doesNotThrowAnyException();
    }

    @Test
    void cadaChaveTemSeuProprioContador() {
        for (int i = 0; i < 3; i++) {
            limite.registrar("login:1.2.3.4", JANELA);
        }

        assertThatCode(() -> limite.conferir("login:5.6.7.8", 3, JANELA, "Calma")).doesNotThrowAnyException();
    }

    @Test
    void limparZeraAChave() {
        for (int i = 0; i < 3; i++) {
            limite.registrar("login:1.2.3.4", JANELA);
        }

        limite.limpar("login:1.2.3.4");

        assertThatCode(this::conferir).doesNotThrowAnyException();
    }
}
