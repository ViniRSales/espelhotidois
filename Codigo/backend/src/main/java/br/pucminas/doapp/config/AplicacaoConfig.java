package br.pucminas.doapp.config;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Configurações gerais da aplicação. {@code @EnableAsync} faz os e-mails saírem em segundo plano. */
@Configuration
@EnableScheduling
@EnableAsync
@EnableConfigurationProperties({ DoacaoProperties.class, SolicitacaoProperties.class, RecuperacaoSenhaProperties.class })
public class AplicacaoConfig {

    /** Relógio no fuso da aplicação; os serviços usam este bean em vez de {@code Instant.now()} para serem testáveis. */
    @Bean
    Clock relogio(@Value("${doapp.fuso-horario}") ZoneId fuso) {
        return Clock.system(fuso);
    }
}
