import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { abrirApp } from '@/features/autenticacao/testes/dados';
import { ApiError } from '@/services/api';
import * as autenticacao from '@/services/autenticacao';

vi.mock('@/services/autenticacao');

const servico = vi.mocked(autenticacao);

describe('EsqueciSenha', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('o login leva à tela de recuperação', async () => {
        const router = abrirApp('/entrar');

        await userEvent.click(screen.getByRole('link', { name: 'Esqueci minha senha' }));

        expect(router.state.location.pathname).toBe('/esqueci-senha');
        expect(screen.getByRole('heading', { name: 'Recuperar senha' })).toBeInTheDocument();
    });

    it('envia o pedido e mostra "Confira seu e-mail" sem dizer se a conta existe', async () => {
        servico.pedirRedefinicao.mockResolvedValue(undefined);
        abrirApp('/esqueci-senha');

        await userEvent.type(screen.getByLabelText('E-mail'), '  maria@email.com ');
        await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }));

        const titulo = await screen.findByRole('heading', { name: 'Confira seu e-mail' });
        expect(titulo).toHaveFocus();
        expect(screen.getByText(/Se existir uma conta com/)).toHaveTextContent('maria@email.com');
        expect(servico.pedirRedefinicao).toHaveBeenCalledWith('maria@email.com');
    });

    it('confere o e-mail antes de chamar a API', async () => {
        abrirApp('/esqueci-senha');

        await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }));
        expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('Informe seu e-mail.');
        expect(screen.getByLabelText('E-mail')).toHaveFocus();

        await userEvent.type(screen.getByLabelText('E-mail'), 'maria@');
        await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }));
        expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('Informe um e-mail válido, como nome@email.com.');

        expect(servico.pedirRedefinicao).not.toHaveBeenCalled();
    });

    it('"Enviar de novo" espera 60 segundos', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        servico.pedirRedefinicao.mockResolvedValue(undefined);
        abrirApp('/esqueci-senha');

        await usuario.type(screen.getByLabelText('E-mail'), 'maria@email.com');
        await usuario.click(screen.getByRole('button', { name: 'Enviar link' }));

        const reenviar = await screen.findByRole('button', { name: 'Enviar de novo' });
        expect(reenviar).toBeDisabled();
        expect(reenviar).toHaveAccessibleDescription(/Você pode pedir outro link em \d+ s\./);

        for (let i = 0; i < 60; i++) {
            await act(() => vi.advanceTimersByTimeAsync(1000));
        }
        expect(reenviar).toBeEnabled();

        await usuario.click(reenviar);
        expect(servico.pedirRedefinicao).toHaveBeenCalledTimes(2);
    });

    it('sem conexão mostra o aviso geral', async () => {
        servico.pedirRedefinicao.mockRejectedValue(new ApiError(0, 'Não foi possível conectar. Confira sua internet e tente de novo.'));
        abrirApp('/esqueci-senha');

        await userEvent.type(screen.getByLabelText('E-mail'), 'maria@email.com');
        await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar.');
        expect(screen.queryByRole('heading', { name: 'Confira seu e-mail' })).not.toBeInTheDocument();
    });
});
