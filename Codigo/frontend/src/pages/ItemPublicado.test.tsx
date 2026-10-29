import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { doacao, foto, ROUPAS } from '@/features/cadastro-doacao/testes/dados';
import { ApiError } from '@/services/api';
import * as doacoes from '@/services/doacoes';

import ItemPublicado from './ItemPublicado';

vi.mock('@/services/doacoes');

const servico = vi.mocked(doacoes);

function abrir() {
    const router = createMemoryRouter(
        [
            { path: '/adicionar/item/:id/publicado', element: <ItemPublicado /> },
            { path: '/adicionar/item/:id', element: <p>Cadastro</p> },
        ],
        { initialEntries: ['/adicionar/item/d1/publicado'] },
    );
    render(<RouterProvider router={router} />);
    return router;
}

describe('ItemPublicado', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('confirma a publicação com o prazo, a prévia e os próximos passos', async () => {
        servico.buscarDoacao.mockResolvedValue(doacao({
            situacao: 'DISPONIVEL', titulo: 'Cachecol', descricao: 'De lã', fotos: [foto('f1')], categoria: ROUPAS,
            condicao: 'EXCELENTE', formasEntrega: ['A_COMBINAR'], localizacao: { bairro: 'Savassi', cidade: 'Belo Horizonte' },
            expiraEm: '2026-11-26T15:00:00Z',
        }));
        abrir();

        expect(await screen.findByRole('heading', { level: 1, name: 'Item publicado!' })).toBeInTheDocument();
        expect(screen.getByText(/Seu cachecol já está visível para pessoas próximas/)).toHaveTextContent('até 26/11/2026');
        expect(screen.getByRole('link', { name: 'Ver meu item' })).toHaveAttribute('href', '/doacoes/d1');
        expect(screen.getByRole('link', { name: 'Cadastrar outro item' })).toHaveAttribute('href', '/adicionar/item');
        expect(screen.getByText('Savassi')).toBeInTheDocument();
        expect(screen.getByText('Excelente')).toBeInTheDocument();
    });

    it('rascunho ainda não publicado volta para o cadastro', async () => {
        servico.buscarDoacao.mockResolvedValue(doacao());
        const router = abrir();

        expect(await screen.findByText('Cadastro')).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/adicionar/item/d1');
    });

    it('mostra o erro se a doação não existir', async () => {
        servico.buscarDoacao.mockRejectedValue(new ApiError(404, 'Doação não encontrada.'));
        abrir();

        expect(await screen.findByRole('alert')).toHaveTextContent('Doação não encontrada.');
    });
});
