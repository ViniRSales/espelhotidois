package br.pucminas.doapp.service;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import br.pucminas.doapp.config.JwtProperties;
import br.pucminas.doapp.model.TokenRevogado;
import br.pucminas.doapp.repository.TokenRevogadoRepository;

/**
 * Emite e revoga os tokens de login. O token só leva o id do usuário ({@code sub}): nome, e-mail e telefone
 * ficariam legíveis para qualquer um que visse o token (RNF03).
 */
@Service
public class TokenService {

    public record TokenEmitido(String token, Instant expiraEm) {
    }

    private final JwtEncoder encoder;
    private final JwtProperties jwt;
    private final TokenRevogadoRepository revogados;
    private final Clock relogio;

    public TokenService(JwtEncoder encoder, JwtProperties jwt, TokenRevogadoRepository revogados, Clock relogio) {
        this.encoder = encoder;
        this.jwt = jwt;
        this.revogados = revogados;
        this.relogio = relogio;
    }

    /** Claim com a versão das sessões da conta no momento do login ({@code Usuario#getVersaoSessao()}). */
    public static final String VERSAO_SESSAO = "sv";

    /**
     * @param versaoSessao versão atual das sessões da conta; o token deixa de valer quando ela mudar
     * @param estendido sessão longa ("manter conectado" ou conta recém-criada)
     */
    public TokenEmitido emitir(String usuarioId, int versaoSessao, boolean estendido) {
        Instant agora = relogio.instant();
        Instant expiraEm = agora.plus(estendido ? jwt.duracaoEstendida() : jwt.duracaoPadrao());
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(jwt.emissor())
                .subject(usuarioId)
                .issuedAt(agora)
                .expiresAt(expiraEm)
                .id(UUID.randomUUID().toString())
                .claim(VERSAO_SESSAO, versaoSessao)
                .build();
        JwsHeader cabecalho = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = encoder.encode(JwtEncoderParameters.from(cabecalho, claims)).getTokenValue();
        return new TokenEmitido(token, expiraEm);
    }

    /** Encerra o token até ele expirar; o {@code JwtDecoder} passa a recusá-lo. */
    public void revogar(Jwt token) {
        if (token.getId() != null && token.getExpiresAt() != null) {
            revogados.save(new TokenRevogado(token.getId(), token.getExpiresAt()));
        }
    }
}
