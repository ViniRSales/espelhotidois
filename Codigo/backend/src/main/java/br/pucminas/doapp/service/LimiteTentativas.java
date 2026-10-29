package br.pucminas.doapp.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import br.pucminas.doapp.exception.MuitasTentativasException;

@Component
public class LimiteTentativas {

    private static final int LIMPAR_ACIMA_DE = 10_000;

    private final Map<String, Deque<Instant>> tentativas = new ConcurrentHashMap<>();
    private final Clock relogio;

    public LimiteTentativas(Clock relogio) {
        this.relogio = relogio;
    }

    public void conferir(String chave, int maximo, Duration janela, String mensagem) {
        Deque<Instant> registro = tentativas.get(chave);
        if (registro == null) {
            return;
        }
        synchronized (registro) {
            descartarVencidas(registro, janela);
            if (registro.size() >= maximo) {
                throw new MuitasTentativasException(mensagem);
            }
        }
    }

    public void registrar(String chave, Duration janela) {
        if (tentativas.size() > LIMPAR_ACIMA_DE) {
            limparVencidas(janela);
        }
        Deque<Instant> registro = tentativas.computeIfAbsent(chave, k -> new ArrayDeque<>());
        synchronized (registro) {
            descartarVencidas(registro, janela);
            registro.addLast(relogio.instant());
        }
    }

    public void limpar(String chave) {
        tentativas.remove(chave);
    }

    private void descartarVencidas(Deque<Instant> registro, Duration janela) {
        Instant limite = relogio.instant().minus(janela);
        while (!registro.isEmpty() && !registro.peekFirst().isAfter(limite)) {
            registro.pollFirst();
        }
    }

    private void limparVencidas(Duration janela) {
        tentativas.entrySet().removeIf(entrada -> {
            synchronized (entrada.getValue()) {
                descartarVencidas(entrada.getValue(), janela);
                return entrada.getValue().isEmpty();
            }
        });
    }
}
