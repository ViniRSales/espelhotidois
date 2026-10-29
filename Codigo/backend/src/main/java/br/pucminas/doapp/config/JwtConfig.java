package br.pucminas.doapp.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

import br.pucminas.doapp.repository.TokenRevogadoRepository;
import br.pucminas.doapp.repository.UsuarioRepository;

/** Assina (login) e confere (cada requisição) os tokens JWT, com HMAC-SHA256 e o segredo de {@link JwtProperties}. */
@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class JwtConfig {

    @Bean
    public JwtEncoder jwtEncoder(JwtProperties jwt) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwt.chave()));
    }

    /**
     * Além da assinatura, confere o emissor, a validade e a sessão ({@link SessaoValidaValidator}: logout, conta
     * apagada, troca de senha). Um token recusado vira 401 pelo {@code authenticationEntryPoint} do
     * {@link SecurityConfig}.
     */
    @Bean
    public JwtDecoder jwtDecoder(JwtProperties jwt, TokenRevogadoRepository revogados, UsuarioRepository usuarios) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(jwt.chave()).macAlgorithm(MacAlgorithm.HS256).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(jwt.emissor()), new SessaoValidaValidator(revogados, usuarios)));
        return decoder;
    }
}
