package br.pucminas.doapp.service.email;

/** Envio de e-mails da aplicação. A implementação usa SMTP; os testes usam um mock. */
public interface EnvioEmail {

    /**
     * Envia em segundo plano: quem chama não espera o servidor de e-mail nem recebe as falhas, que vão para o log.
     *
     * @param texto versão em texto puro, para clientes de e-mail que não mostram HTML
     */
    void enviar(String para, String assunto, String texto, String html);
}
