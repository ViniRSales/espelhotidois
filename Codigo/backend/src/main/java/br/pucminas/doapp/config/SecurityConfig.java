package br.pucminas.doapp.config;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import br.pucminas.doapp.exception.ErroResposta;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

/**
 * Segurança da API: sem sessão no servidor, login por token JWT ({@code Authorization: Bearer}),
 * leitura pública e escrita só para usuários autenticados.
 *
 * <p>O token é conferido pelo {@code JwtDecoder} do {@link JwtConfig}; o id do usuário ({@code sub}) vira o nome
 * da {@code Authentication}, que é o que o {@code ControleAcessoService} usa.
 */
@Configuration
@Import(JwtConfig.class)
public class SecurityConfig {

    static final String ENTRE_NA_CONTA = "Entre na sua conta para continuar.";
    static final String SESSAO_EXPIRADA = "Sua sessão expirou. Entre de novo para continuar.";

    private final JsonMapper jsonMapper;

    public SecurityConfig(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    @Bean
    SecurityFilterChain filtros(HttpSecurity http) throws Exception {
        AuthenticationEntryPoint naoAutenticado = (req, res, ex) -> escrever(res, HttpStatus.UNAUTHORIZED,
                ex instanceof OAuth2AuthenticationException ? SESSAO_EXPIRADA : ENTRE_NA_CONTA);

        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {})
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(sessao -> sessao.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .oauth2ResourceServer(jwt -> jwt
                        .jwt(Customizer.withDefaults())
                        .authenticationEntryPoint(naoAutenticado))
                // A ordem importa: a primeira regra que combinar com a requisição vale.
                .authorizeHttpRequests(regras -> regras
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/cadastro", "/api/auth/login",
                                "/api/auth/esqueci-senha", "/api/auth/redefinir-senha").permitAll()
                        .requestMatchers("/api/auth/**").authenticated()
                        // GETs com dados de quem está logado, que a regra geral abaixo deixaria públicos.
                        .requestMatchers(HttpMethod.GET, "/api/doacoes/rascunho").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(erros -> erros
                        .authenticationEntryPoint(naoAutenticado)
                        .accessDeniedHandler((req, res, ex) ->
                                escrever(res, HttpStatus.FORBIDDEN, "Você não tem permissão para fazer isso.")))
                .build();
    }

    @Bean
    CorsConfigurationSource cors(@Value("${doapp.cors.origens-permitidas}") List<String> origens) {
        var config = new CorsConfiguration();
        config.setAllowedOrigins(origens);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        var fonte = new UrlBasedCorsConfigurationSource();
        fonte.registerCorsConfiguration("/api/**", config);
        return fonte;
    }

    /** Usado para gravar e conferir senhas; a senha nunca é salva em texto. */
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private void escrever(HttpServletResponse res, HttpStatus status, String mensagem) throws IOException {
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        jsonMapper.writeValue(res.getOutputStream(), ErroResposta.de(status.value(), status.getReasonPhrase(), mensagem));
    }
}
