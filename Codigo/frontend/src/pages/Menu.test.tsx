import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AutenticacaoProvider from '@/features/autenticacao/AutenticacaoProvider';
import RotaProtegida from '@/features/autenticacao/RotaProtegida';
import { lerSessaoSalva, salvarSessao } from '@/features/autenticacao/sessaoSalva';
import { usuario } from '@/features/autenticacao/testes/dados';
import * as autenticacao from '@/services/autenticacao';

import Menu from './Menu';

vi.mock('@/services/autenticacao');

const servico = vi.mocked(autenticacao);

function abrir() {
    const router = createMemoryRouter(
        [
            { path: '/', element: <p>Home</p> },
            { path: '/entrar', element: <p>Tela Entrar</p> },
            { element: <RotaProtegida />, children: [{ path: '/menu', element: <Menu /> }] },
        ],
        { initialEntries: ['/menu'] },
    );
    render(<AutenticacaoProvider><RouterProvider router={router} /></AutenticacaoProvider>);
    return router;
}

describe('Menu', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        salvarSessao({ token: 't1', expiraEm: '2099-01-01T00:00:00Z' }, true);
        servico.buscarUsuarioAtual.mockResolvedValue(usuario());
    });

    it('"Sair" revoga o token, apaga a sessão e leva à Home', async () => {
        servico.sair.mockResolvedValue(undefined);
        const router = abrir();

        await userEvent.click(await screen.findByRole('button', { name: 'Sair' }));

        expect(await screen.findByText('Home')).toBeInTheDocument();
        expect(servico.sair).toHaveBeenCalledOnce();
        expect(lerSessaoSalva()).toBeNull();
        expect(router.state.location.pathname).toBe('/');
    });

    it('sai mesmo sem conexão com a API', async () => {
        servico.sair.mockRejectedValue(new Error('offline'));
        abrir();

        await userEvent.click(await screen.findByRole('button', { name: 'Sair' }));

        expect(await screen.findByText('Home')).toBeInTheDocument();
        expect(lerSessaoSalva()).toBeNull();
    });
});
