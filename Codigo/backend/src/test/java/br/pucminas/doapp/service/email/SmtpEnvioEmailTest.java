package br.pucminas.doapp.service.email;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import br.pucminas.doapp.config.RecuperacaoSenhaProperties;
import jakarta.mail.internet.MimeMessage;

class SmtpEnvioEmailTest {

    static final RecuperacaoSenhaProperties CONFIG = new RecuperacaoSenhaProperties(Duration.ofMinutes(30),
            Duration.ofMinutes(2), "http://localhost:5173", "Doapp <nao-responda@doapp.com.br>", false);

    @SuppressWarnings("unchecked")
    private static ObjectProvider<JavaMailSender> provedor(JavaMailSender sender) {
        ObjectProvider<JavaMailSender> provedor = mock(ObjectProvider.class);
        when(provedor.getIfAvailable()).thenReturn(sender);
        return provedor;
    }

    @Test
    void montaOEmailComRemetenteDestinatarioETexto() throws Exception {
        JavaMailSender sender = mock(JavaMailSender.class);
        when(sender.createMimeMessage()).thenReturn(new JavaMailSenderImpl().createMimeMessage());

        new SmtpEnvioEmail(provedor(sender), CONFIG).enviar("maria@email.com", "Assunto", "texto", "<p>html</p>");

        var mensagem = ArgumentCaptor.forClass(MimeMessage.class);
        verify(sender).send(mensagem.capture());
        assertThat(mensagem.getValue().getFrom()[0].toString()).isEqualTo("Doapp <nao-responda@doapp.com.br>");
        assertThat(mensagem.getValue().getAllRecipients()[0].toString()).isEqualTo("maria@email.com");
        assertThat(mensagem.getValue().getSubject()).isEqualTo("Assunto");
    }

    @Test
    void falhaNoServidorDeEmailNaoChegaAQuemChamou() {
        JavaMailSender sender = mock(JavaMailSender.class);
        when(sender.createMimeMessage()).thenReturn(new JavaMailSenderImpl().createMimeMessage());
        doThrow(new MailSendException("SMTP fora do ar")).when(sender).send(any(MimeMessage.class));

        assertThatNoException().isThrownBy(() ->
                new SmtpEnvioEmail(provedor(sender), CONFIG).enviar("maria@email.com", "Assunto", "texto", "html"));
    }

    @Test
    void semServidorConfiguradoNaoQuebra() {
        assertThatNoException().isThrownBy(() ->
                new SmtpEnvioEmail(provedor(null), CONFIG).enviar("maria@email.com", "Assunto", "texto", "html"));
    }
}
