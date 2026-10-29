package br.pucminas.doapp.config;

import java.util.Optional;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

import br.pucminas.doapp.model.Usuario;
import br.pucminas.doapp.repository.TokenRevogadoRepository;
import br.pucminas.doapp.repository.UsuarioRepository;
import br.pucminas.doapp.service.TokenService;

public class SessaoValidaValidator implements OAuth2TokenValidator<Jwt> {

    private final TokenRevogadoRepository revogados;
    private final UsuarioRepository usuarios;

    public SessaoValidaValidator(TokenRevogadoRepository revogados, UsuarioRepository usuarios) {
        this.revogados = revogados;
        this.usuarios = usuarios;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt token) {
        if (token.getId() != null && revogados.existsById(token.getId())) {
            return recusar("Token encerrado pelo logout.");
        }
        Optional<Usuario> usuario = token.getSubject() == null ? Optional.empty() : usuarios.findById(token.getSubject());
        if (usuario.isEmpty()) {
            return recusar("A conta do token não existe mais.");
        }
        if (versao(token) != usuario.get().getVersaoSessao()) {
            return recusar("Sessão encerrada pela troca de senha.");
        }
        return OAuth2TokenValidatorResult.success();
    }

    private static int versao(Jwt token) {
        Object valor = token.getClaim(TokenService.VERSAO_SESSAO);
        return valor instanceof Number numero ? numero.intValue() : 0;
    }

    private static OAuth2TokenValidatorResult recusar(String motivo) {
        return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", motivo, null));
    }
}
