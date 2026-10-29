import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AutenticacaoProvider from '@/features/autenticacao/AutenticacaoProvider';
import { salvarSessao } from '@/features/autenticacao/sessaoSalva';
import { usuario } from '@/features/autenticacao/testes/dados';
import MainLayout from '@/layouts/MainLayout';
import Busca from '@/pages/Busca';
import * as autenticacao from '@/services/autenticacao';

vi.mock('@/services/autenticacao');

const servico = vi.mocked(autenticacao);

function abrir(caminho = '/') {
    const router = createMemoryRouter(
        [
            {
                element: <MainLayout />,
                children: [
                    { path: '/', element: <p>Home</p> },
                    { path: '/adicionar', element: <p>Tela Adicionar</p> },
                    { path: '/buscar', element: <Busca /> },
                ],
            },
        ],
        { initialEntries: [caminho] },
    );
    render(<AutenticacaoProvider><RouterProvider router={router} /></AutenticacaoProvider>);
    return router;
}

function entrar() {
    salvarSessao({ token: 't1', expiraEm: '2099-01-01T00:00:00Z' }, true);
    servico.buscarUsuarioAtual.mockResolvedValue(usuario());
}

describe('AppHeader', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('para visitantes, mostra só o logo e a busca', () => {
        abrir();

        expect(screen.getByRole('link', { name: 'Doapp, ir para o início' })).toHaveAttribute('href', '/');
        expect(screen.getByRole('search', { name: 'Doações e pedidos' })).toBeInTheDocument();
        expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Notificações' })).not.toBeInTheDocument();
    });

    it('para quem entrou, mostra a navegação e os atalhos, marcando a página atual', async () => {
        entrar();
        abrir('/adicionar');

        const navegacoes = await screen.findAllByRole('navigation', { name: 'Principal' });
        expect(navegacoes).toHaveLength(2);
        for (const nav of navegacoes) {
            const links = within(nav).getAllByRole('link').map((link) => link.textContent);
            expect(links).toEqual(['Início', 'Bate-papo', 'Adicionar', 'Você', 'Menu']);
            expect(within(nav).getByRole('link', { name: 'Adicionar' })).toHaveAttribute('aria-current', 'page');
            expect(within(nav).getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current');
        }
        expect(screen.getByRole('link', { name: 'Sua localização' })).toHaveAttribute('href', '/localizacao');
        expect(screen.getByRole('link', { name: 'Notificações' })).toHaveAttribute('href', '/notificacoes');
    });

    it('a busca leva à página de resultados com o termo na URL', async () => {
        const router = abrir();

        await userEvent.type(screen.getByRole('searchbox', { name: 'Pesquisar' }), '  cadeira de rodas {Enter}');

        expect(router.state.location.pathname).toBe('/buscar');
        expect(router.state.location.search).toBe('?q=cadeira+de+rodas');
        expect(await screen.findByRole('heading', { name: 'Resultados para “cadeira de rodas”' })).toBeInTheDocument();
    });

    it('busca vazia não sai da página', async () => {
        const router = abrir();

        await userEvent.type(screen.getByRole('searchbox', { name: 'Pesquisar' }), '   {Enter}');

        expect(router.state.location.pathname).toBe('/');
    });

    it('a busca não tem botão de microfone, só o campo', () => {
        abrir();

        const busca = screen.getByRole('search', { name: 'Doações e pedidos' });
        expect(within(busca).queryByRole('button')).not.toBeInTheDocument();
    });
});
