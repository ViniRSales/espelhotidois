package br.pucminas.doapp.service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import br.pucminas.doapp.model.Doacao;
import br.pucminas.doapp.model.SituacaoDoacao;
import br.pucminas.doapp.repository.DoacaoRepository;

/**
 * Desativa as doações disponíveis cujo prazo terminou, no horário de {@code doapp.doacoes.expiracao-cron}.
 * O aviso antes do prazo depende das notificações e fica para essa task.
 */
@Component
public class ExpiracaoDoacoesJob {

    private static final Logger log = LoggerFactory.getLogger(ExpiracaoDoacoesJob.class);

    private final DoacaoRepository repository;
    private final Clock relogio;

    public ExpiracaoDoacoesJob(DoacaoRepository repository, Clock relogio) {
        this.repository = repository;
        this.relogio = relogio;
    }

    /** Devolve quantas doações expiraram. */
    @Scheduled(cron = "${doapp.doacoes.expiracao-cron}", zone = "${doapp.fuso-horario}")
    public int expirarVencidas() {
        Instant agora = Instant.now(relogio);
        List<Doacao> vencidas = repository.findBySituacaoAndExpiraEmBefore(SituacaoDoacao.DISPONIVEL, agora);
        if (vencidas.isEmpty()) {
            return 0;
        }
        vencidas.forEach(doacao -> doacao.expirar(agora));
        repository.saveAll(vencidas);
        log.info("Expiração: {} doações desativadas por fim do prazo", vencidas.size());
        return vencidas.size();
    }
}
