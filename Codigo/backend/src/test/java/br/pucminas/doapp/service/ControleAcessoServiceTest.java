package br.pucminas.doapp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import br.pucminas.doapp.exception.AcessoNegadoException;
import br.pucminas.doapp.exception.NaoAutenticadoException;

class ControleAcessoServiceTest {

    private final ControleAcessoService service = new ControleAcessoService();

    @AfterEach
    void limparContexto() {
        SecurityContextHolder.clearContext();
    }

    private void logarComo(String idUsuario) {
        var autenticacao = new UsernamePasswordAuthenticationToken(idUsuario, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(autenticacao);
    }

    @Test
    void donoPodeAlterarOProprioDocumento() {
        logarComo("usuario-1");

        assertThatNoException().isThrownBy(() -> service.garantirDono("usuario-1"));
        assertThat(service.ehDono("usuario-1")).isTrue();
    }

    @Test
    void outroUsuarioRecebe403() {
        logarComo("usuario-2");

        assertThatThrownBy(() -> service.garantirDono("usuario-1")).isInstanceOf(AcessoNegadoException.class);
    }

    @Test
    void semLoginRecebe401() {
        assertThatThrownBy(service::idUsuarioAtual).isInstanceOf(NaoAutenticadoException.class);
    }
}
