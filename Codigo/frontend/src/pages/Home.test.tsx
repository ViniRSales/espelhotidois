import { act, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AutenticacaoProvider from '@/features/autenticacao/AutenticacaoProvider';
import { salvarSessao } from '@/features/autenticacao/sessaoSalva';
import { usuario } from '@/features/autenticacao/testes/dados';
import * as autenticacao from '@/services/autenticacao';

import Home from './Home';

vi.mock('@/services/autenticacao');
vi.mock('@/hooks/useCategorias', () => ({
    useCategorias: () => ({ categorias: [], carregando: false, erro: null }),
}));

const servico = vi.mocked(autenticacao);

function abrir() {
    const router = createMemoryRouter([{ path: '/', element: <Home /> }]);
    render(<AutenticacaoProvider><RouterProvider router={router} /></AutenticacaoProvider>);
}

describe('Home', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('convida quem não entrou a criar conta ou entrar', () => {
        abrir();

        const convite = screen.getByRole('region', { name: 'Doe e receba' });
        expect(convite).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/criar-conta');
        expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar');
    });

    it('quem já entrou não vê o convite', async () => {
        salvarSessao({ token: 't1', expiraEm: '2099-01-01T00:00:00Z' }, true);
        servico.buscarUsuarioAtual.mockResolvedValue(usuario());
        abrir();

        expect(await screen.findByText('Bem-vindos ao Doapp!')).toBeInTheDocument();
        await vi.waitFor(() => expect(servico.buscarUsuarioAtual).toHaveBeenCalled());
        await act(async () => {});
        expect(screen.queryByRole('region', { name: 'Doe e receba' })).not.toBeInTheDocument();
    });
});
