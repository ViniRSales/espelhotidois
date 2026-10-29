package br.pucminas.doapp.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import br.pucminas.doapp.config.RecuperacaoSenhaProperties;
import br.pucminas.doapp.exception.DadosInvalidosException;
import br.pucminas.doapp.model.RedefinicaoSenha;
import br.pucminas.doapp.model.Usuario;
import br.pucminas.doapp.repository.RedefinicaoSenhaRepository;
import br.pucminas.doapp.repository.UsuarioRepository;
import br.pucminas.doapp.service.email.EnvioEmail;

@Service
public class RecuperacaoSenhaService {

    public static final String LINK_INVALIDO = "Este link não vale mais. Peça um novo.";

    private static final Logger log = LoggerFactory.getLogger(RecuperacaoSenhaService.class);
    private static final SecureRandom ALEATORIO = new SecureRandom();

    private final UsuarioRepository usuarios;
    private final RedefinicaoSenhaRepository redefinicoes;
    private final PasswordEncoder senhas;
    private final EnvioEmail email;
    private final RecuperacaoSenhaProperties config;
    private final Clock relogio;

    public RecuperacaoSenhaService(UsuarioRepository usuarios, RedefinicaoSenhaRepository redefinicoes,
            PasswordEncoder senhas, EnvioEmail email, RecuperacaoSenhaProperties config, Clock relogio) {
        this.usuarios = usuarios;
        this.redefinicoes = redefinicoes;
        this.senhas = senhas;
        this.email = email;
        this.config = config;
        this.relogio = relogio;
    }

    public void pedir(String emailNormalizado) {
        Optional<Usuario> encontrado = usuarios.findByEmail(emailNormalizado);
        if (encontrado.isEmpty()) {
            return;
        }
        Usuario usuario = encontrado.get();
        Instant agora = relogio.instant();
        if (redefinicoes.existsByUsuarioIdAndCriadaEmAfter(usuario.getId(), agora.minus(config.intervaloMinimo()))) {
            return;
        }

        String token = gerarToken();
        redefinicoes.save(new RedefinicaoSenha(usuario.getId(), hash(token), agora, agora.plus(config.validade())));
        String link = config.urlApp().replaceAll("/+$", "") + "/redefinir-senha?token=" + token;
        if (config.registrarLinkNoLog()) {
            log.info("[dev] Link para redefinir a senha: {}", link);
        }
        email.enviar(usuario.getEmail(), "Crie uma senha nova no Doapp",
                texto(usuario.getNome(), link), html(usuario.getNome(), link));
    }

    public void redefinir(String token, String novaSenha) {
        if (AutenticacaoService.senhaLongaDemais(novaSenha)) {
            throw new DadosInvalidosException("senha", "Use no máximo 72 caracteres.");
        }
        Instant agora = relogio.instant();
        RedefinicaoSenha pedido = redefinicoes.findByTokenHash(hash(token))
                .filter(encontrado -> !encontrado.venceu(agora))
                .orElseThrow(() -> new DadosInvalidosException("token", LINK_INVALIDO));
        Usuario usuario = usuarios.findById(pedido.getUsuarioId())
                .orElseThrow(() -> new DadosInvalidosException("token", LINK_INVALIDO));

        redefinicoes.deleteByUsuarioId(usuario.getId());
        usuario.redefinirSenha(senhas.encode(novaSenha), agora);
        usuarios.save(usuario);
    }

    static String gerarToken() {
        byte[] bytes = new byte[32];
        ALEATORIO.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String hash(String token) {
        try {
            byte[] resumo = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(resumo);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 sempre existe na JVM", ex);
        }
    }

    private String texto(String nome, String link) {
        return """
                Olá, %s!

                Recebemos um pedido para criar uma senha nova para a sua conta no Doapp.
                Para continuar, abra o link abaixo (ele vale por %d minutos e só pode ser usado uma vez):

                %s

                Se não foi você, pode ignorar este e-mail: sua senha continua a mesma.

                Equipe Doapp
                """.formatted(nome, config.validade().toMinutes(), link);
    }

    private String html(String nome, String link) {
        String linkSeguro = HtmlUtils.htmlEscape(link);
        return """
                <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #1f1f1f; max-width: 480px">
                  <p>Olá, %s!</p>
                  <p>Recebemos um pedido para criar uma senha nova para a sua conta no Doapp.</p>
                  <p><a href="%s" style="display: inline-block; padding: 12px 24px; border-radius: 999px; background: #c8643c; color: #ffffff; text-decoration: none">Criar senha nova</a></p>
                  <p style="font-size: 14px; color: #5c5c5c">O link vale por %d minutos e só pode ser usado uma vez. Se o botão não funcionar, copie este endereço no navegador:<br>%s</p>
                  <p style="font-size: 14px; color: #5c5c5c">Se não foi você, pode ignorar este e-mail: sua senha continua a mesma.</p>
                  <p>Equipe Doapp</p>
                </div>
                """.formatted(HtmlUtils.htmlEscape(nome), linkSeguro, config.validade().toMinutes(), linkSeguro);
    }
}
