import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { solicitacao } from '@/features/solicitacao/testes/dados';
import { ApiError } from '@/services/api';
import * as solicitacoes from '@/services/solicitacoes';

import PedidoPublicado from './PedidoPublicado';

vi.mock('@/services/solicitacoes');

const servico = vi.mocked(solicitacoes);

function abrir() {
    const router = createMemoryRouter([{ path: '/adicionar/pedido/:id/publicado', element: <PedidoPublicado /> }], {
        initialEntries: ['/adicionar/pedido/s1/publicado'],
    });
    render(<RouterProvider router={router} />);
}

describe('PedidoPublicado', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('confirma a publicação com a prévia e os próximos passos', async () => {
        servico.buscarSolicitacao.mockResolvedValue(solicitacao({ souDono: true }));
        abrir();

        expect(await screen.findByRole('heading', { level: 1, name: 'Pedido publicado!' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Ver meu pedido' })).toHaveAttribute('href', '/pedidos/s1');
        expect(screen.getByRole('link', { name: 'Cadastrar outro pedido' })).toHaveAttribute('href', '/adicionar/pedido');
        expect(screen.getByText('Urgente')).toBeInTheDocument();
        expect(screen.getByText('Ipiranga, Belo Horizonte')).toBeInTheDocument();
    });

    it('mostra o erro se o pedido não carregar', async () => {
        servico.buscarSolicitacao.mockRejectedValue(new ApiError(500, 'Algo deu errado. Tente de novo em instantes.'));
        abrir();

        expect(await screen.findByRole('alert')).toHaveTextContent('Tente de novo em instantes.');
    });
});
