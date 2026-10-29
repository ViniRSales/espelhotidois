package br.pucminas.doapp.service.email;

import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import br.pucminas.doapp.config.RecuperacaoSenhaProperties;
import jakarta.mail.MessagingException;

/** Envia e-mails pelo servidor SMTP configurado em {@code spring.mail} (Mailpit em desenvolvimento). */
@Service
public class SmtpEnvioEmail implements EnvioEmail {

    private static final Logger log = LoggerFactory.getLogger(SmtpEnvioEmail.class);

    /** {@code null} quando {@code spring.mail.host} não foi configurado: a API sobe, mas não envia e-mails. */
    private final JavaMailSender mailSender;
    private final String remetente;

    public SmtpEnvioEmail(ObjectProvider<JavaMailSender> mailSender, RecuperacaoSenhaProperties propriedades) {
        this.mailSender = mailSender.getIfAvailable();
        this.remetente = propriedades.remetente();
        if (this.mailSender == null) {
            log.warn("Servidor de e-mail não configurado (MAIL_HOST): os e-mails de recuperação de senha não serão enviados.");
        }
    }

    @Async
    @Override
    public void enviar(String para, String assunto, String texto, String html) {
        if (mailSender == null) {
            log.error("E-mail '{}' não enviado: servidor de e-mail não configurado (MAIL_HOST).", assunto);
            return;
        }
        try {
            var mensagem = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(mensagem, true, StandardCharsets.UTF_8.name());
            helper.setFrom(remetente);
            helper.setTo(para);
            helper.setSubject(assunto);
            helper.setText(texto, html);
            mailSender.send(mensagem);
        } catch (MessagingException | MailException ex) {
            // Não registra o destinatário nem o conteúdo: o e-mail leva um link de uso pessoal.
            log.error("Não foi possível enviar o e-mail '{}': {}", assunto, ex.getMessage());
        }
    }
}
