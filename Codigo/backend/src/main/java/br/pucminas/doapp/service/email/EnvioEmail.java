package br.pucminas.doapp.service.email;

public interface EnvioEmail {

    void enviar(String para, String assunto, String texto, String html);
}
