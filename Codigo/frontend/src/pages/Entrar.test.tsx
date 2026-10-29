import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { lerSessaoSalva } from '@/features/autenticacao/sessaoSalva';
import { abrirApp, sessao } from '@/features/autenticacao/testes/dados';
import { ApiError } from '@/services/api';
import * as autenticacao from '@/services/autenticacao';

vi.mock('@/services/autenticacao');

const servico = vi.mocked(autenticacao);

async function preencher(email: string, senha: string) {
    await userEvent.type(screen.getByLabelText('E-mail'), email);
    await userEvent.type(screen.getByLabelText('Senha'), senha);
}

describe('Entrar', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('entra e leva à Home, mantendo conectado por padrão', async () => {
        servico.entrar.mockResolvedValue(sessao());
        const router = abrirApp('/entrar');

        await preencher('  maria@email.com ', 'segredo123');
        expect(screen.getByRole('checkbox', { name: 'Manter conectado' })).toBeChecked();
        await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

        expect(await screen.findByText('Home')).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/');
        expect(servico.entrar).toHaveBeenCalledWith({ email: 'maria@email.com', senha: 'segredo123', manterConectado: true });
        expect(localStorage.getItem('doapp.sessao')).not.toBeNull();
    });

    it('sem "manter conectado", a sessão fica só nesta aba', async () => {
        servico.entrar.mockResolvedValue(sessao());
        abrirApp('/entrar');

        await preencher('maria@email.com', 'segredo123');
        await userEvent.click(screen.getByRole('checkbox', { name: 'Manter conectado' }));
        await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

        await screen.findByText('Home');
        expect(servico.entrar).toHaveBeenCalledWith(expect.objectContaining({ manterConectado: false }));
        expect(localStorage.getItem('doapp.sessao')).toBeNull();
        expect(sessionStorage.getItem('doapp.sessao')).not.toBeNull();
    });

    it('volta para a tela protegida depois do login', async () => {
        servico.entrar.mockResolvedValue(sessao());
        const router = abrirApp('/adicionar');
        await screen.findByRole('heading', { name: 'Entrar' });

        await preencher('maria@email.com', 'segredo123');
        await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

        expect(await screen.findByText('Tela Adicionar')).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/adicionar');
    });

    it('mostra os erros nos campos e leva o foco ao primeiro, sem chamar a API', async () => {
        abrirApp('/entrar');

        await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

        const email = screen.getByLabelText('E-mail');
        expect(email).toHaveAttribute('aria-invalid', 'true');
        expect(email).toHaveAccessibleDescription('Informe seu e-mail.');
        expect(screen.getByLabelText('Senha')).toHaveAccessibleDescription('Informe sua senha.');
        expect(email).toHaveFocus();
        expect(servico.entrar).not.toHaveBeenCalled();
    });

    it('o erro some quando a pessoa corrige o campo', async () => {
        abrirApp('/entrar');
        await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

        await userEvent.type(screen.getByLabelText('E-mail'), 'm');

        expect(screen.getByLabelText('E-mail')).not.toHaveAttribute('aria-invalid');
    });

    it('senha errada mostra o aviso geral da API e não salva sessão', async () => {
        servico.entrar.mockRejectedValue(new ApiError(401, 'E-mail ou senha incorretos.'));
        abrirApp('/entrar');

        await preencher('maria@email.com', 'errada123');
        await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

        const alerta = await screen.findByRole('alert');
        expect(alerta).toHaveTextContent('E-mail ou senha incorretos.');
        expect(alerta).toHaveFocus();
        expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
        expect(lerSessaoSalva()).toBeNull();
    });

    it('"Mostrar senha" deixa ver o que foi digitado', async () => {
        abrirApp('/entrar');
        const senha = screen.getByLabelText('Senha');
        expect(senha).toHaveAttribute('type', 'password');

        await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));

        expect(senha).toHaveAttribute('type', 'text');
        expect(screen.getByRole('button', { name: 'Ocultar senha' })).toBeInTheDocument();
    });

    it('leva ao cadastro mantendo para onde voltar', async () => {
        const router = abrirApp('/adicionar');
        await screen.findByRole('heading', { name: 'Entrar' });

        await userEvent.click(screen.getByRole('link', { name: 'Criar conta' }));

        expect(router.state.location.pathname).toBe('/criar-conta');
        expect(router.state.location.state).toEqual({ de: '/adicionar' });
    });

    it('o logo volta para o início', () => {
        abrirApp('/entrar');

        expect(screen.getByRole('link', { name: 'Doapp, ir para o início' })).toHaveAttribute('href', '/');
    });
});
