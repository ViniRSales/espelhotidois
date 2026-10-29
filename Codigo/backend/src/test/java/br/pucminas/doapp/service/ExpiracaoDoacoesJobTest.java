package br.pucminas.doapp.service;

import static br.pucminas.doapp.service.DoacaoFixtures.AGORA;
import static br.pucminas.doapp.service.DoacaoFixtures.RELOGIO;
import static br.pucminas.doapp.service.DoacaoFixtures.rascunhoCompleto;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import br.pucminas.doapp.model.Doacao;
import br.pucminas.doapp.model.SituacaoDoacao;
import br.pucminas.doapp.repository.DoacaoRepository;

@ExtendWith(MockitoExtension.class)
class ExpiracaoDoacoesJobTest {

    @Mock
    private DoacaoRepository repository;

    @Test
    void expiraAsDoacoesDisponiveisVencidas() {
        Doacao vencida = publicadaHa(31);
        when(repository.findBySituacaoAndExpiraEmBefore(SituacaoDoacao.DISPONIVEL, AGORA)).thenReturn(List.of(vencida));

        int expiradas = new ExpiracaoDoacoesJob(repository, RELOGIO).expirarVencidas();

        assertThat(expiradas).isEqualTo(1);
        assertThat(vencida.getSituacao()).isEqualTo(SituacaoDoacao.EXPIRADA);
        assertThat(vencida.getAtualizadaEm()).isEqualTo(AGORA);
        verify(repository).saveAll(List.of(vencida));
    }

    @Test
    void semDoacoesVencidasNaoGravaNada() {
        when(repository.findBySituacaoAndExpiraEmBefore(SituacaoDoacao.DISPONIVEL, AGORA)).thenReturn(List.of());

        assertThat(new ExpiracaoDoacoesJob(repository, RELOGIO).expirarVencidas()).isZero();
        verify(repository, never()).saveAll(any());
    }

    private static Doacao publicadaHa(int dias) {
        Doacao doacao = rascunhoCompleto("d1", "u1");
        doacao.publicar(AGORA.minus(Duration.ofDays(dias)), Duration.ofDays(30));
        return doacao;
    }
}
