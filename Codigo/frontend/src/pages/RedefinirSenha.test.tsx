import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { lerSessaoSalva, salvarSessao } from '@/features/autenticacao/sessaoSalva';
import { abrirApp, usuario } from '@/features/autenticacao/testes/dados';
import { ApiError } from '@/services/api';
import * as autenticacao from '@/services/autenticacao';

vi.mock('@/services/autenticacao');

const servico = vi.mocked(autenticacao);

describe('RedefinirSenha', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('salva a senha nova e leva ao login com o aviso de sucesso', async () => {
        servico.redefinirSenha.mockResolvedValue(undefined);
        const router = abrirApp('/redefinir-senha?token=abc123');

        await userEvent.type(screen.getByLabelText('Nova senha'), 'novaSenha99');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar senha nova' }));

        expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/entrar');
        expect(screen.getByRole('status')).toHaveTextContent('Senha alterada');
        expect(servico.redefinirSenha).toHaveBeenCalledWith('abc123', 'novaSenha99');
    });

    it('confere a regra da senha antes de chamar a API', async () => {
        abrirApp('/redefinir-senha?token=abc123');

        await userEvent.type(screen.getByLabelText('Nova senha'), 'curta');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar senha nova' }));

        const campo = screen.getByLabelText('Nova senha');
        expect(campo).toHaveAccessibleDescription('Use pelo menos 8 caracteres. A senha precisa ter pelo menos 8 caracteres.');
        expect(campo).toHaveFocus();
        expect(servico.redefinirSenha).not.toHaveBeenCalled();
    });

    it('link vencido ou já usado mostra o erro e oferece um novo link', async () => {
        servico.redefinirSenha.mockRejectedValue(new ApiError(400, 'Confira os campos destacados e tente de novo.', [
            { campo: 'token', mensagem: 'Este link não vale mais. Peça um novo.' },
        ]));
        abrirApp('/redefinir-senha?token=velho');

        await userEvent.type(screen.getByLabelText('Nova senha'), 'novaSenha99');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar senha nova' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Este link não vale mais. Peça um novo.');
        expect(screen.getByRole('link', { name: 'Pedir um novo link' })).toHaveAttribute('href', '/esqueci-senha');
        expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument();
    });

    it('sem token na URL já mostra que o link não vale', () => {
        abrirApp('/redefinir-senha');

        expect(screen.getByRole('alert')).toHaveTextContent('Este link não vale mais.');
        expect(screen.getByRole('link', { name: 'Pedir um novo link' })).toBeInTheDocument();
    });

    it('quem estava logado neste aparelho sai antes de ir para o login', async () => {
        salvarSessao({ token: 't1', expiraEm: '2099-01-01T00:00:00Z' }, true);
        servico.buscarUsuarioAtual.mockResolvedValue(usuario());
        servico.redefinirSenha.mockResolvedValue(undefined);
        servico.sair.mockResolvedValue(undefined);
        const router = abrirApp('/redefinir-senha?token=abc123');

        await userEvent.type(await screen.findByLabelText('Nova senha'), 'novaSenha99');
        await userEvent.click(screen.getByRole('button', { name: 'Salvar senha nova' }));

        expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/entrar');
        expect(lerSessaoSalva()).toBeNull();
    });
});
