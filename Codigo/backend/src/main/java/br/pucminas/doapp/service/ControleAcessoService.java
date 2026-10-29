package br.pucminas.doapp.service;

import java.util.Objects;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import br.pucminas.doapp.exception.AcessoNegadoException;
import br.pucminas.doapp.exception.NaoAutenticadoException;

/**
 * Regras de acesso usadas pelos serviços de doação, solicitação e conta.
 *
 * <p>A validação do token JWT (veja o {@code SecurityConfig}) coloca o id do usuário ({@code sub}) como nome da
 * {@link Authentication}. Assim os serviços só precisam chamar {@link #garantirDono(String)} antes de alterar um
 * documento.
 */
@Service
public class ControleAcessoService {

    /** Id do usuário logado; lança 401 se ninguém estiver autenticado. */
    public String idUsuarioAtual() {
        Authentication autenticacao = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacao == null || !autenticacao.isAuthenticated()
                || autenticacao instanceof AnonymousAuthenticationToken) {
            throw new NaoAutenticadoException("Entre na sua conta para continuar.");
        }
        return autenticacao.getName();
    }

    public boolean ehDono(String donoId) {
        return Objects.equals(idUsuarioAtual(), donoId);
    }

    /** Lança 403 se o usuário logado não for o dono do documento. */
    public void garantirDono(String donoId) {
        if (!ehDono(donoId)) {
            throw new AcessoNegadoException("Só quem criou este item pode alterá-lo.");
        }
    }
}
