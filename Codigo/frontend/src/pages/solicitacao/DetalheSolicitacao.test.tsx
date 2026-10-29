import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { solicitacao } from '@/features/solicitacao/testes/dados';
import { ApiError } from '@/services/api';
import * as solicitacoes from '@/services/solicitacoes';

import DetalheSolicitacao from './DetalheSolicitacao';

vi.mock('@/services/solicitacoes');

const servico = vi.mocked(solicitacoes);

function abrir() {
    const router = createMemoryRouter([{ path: '/pedidos/:id', element: <DetalheSolicitacao /> }], {
        initialEntries: ['/pedidos/s1'],
    });
    render(<RouterProvider router={router} />);
}

describe('DetalheSolicitacao', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('mostra o pedido com a urgência em destaque e sem dados de quem pediu', async () => {
        servico.buscarSolicitacao.mockResolvedValue(solicitacao());
        abrir();

        expect(await screen.findByRole('heading', { level: 1, name: 'Roupas de frio para crianças' })).toBeInTheDocument();
        expect(screen.getByText('Urgente')).toBeInTheDocument();
        expect(screen.getByText('Roupas')).toBeInTheDocument();
        expect(screen.getAllByText(/Ipiranga, Belo Horizonte/).length).toBeGreaterThan(0);
        expect(screen.queryByText(/@|telefone:/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('img', { name: /Foto de referência/ })).not.toBeInTheDocument();
    });

    it('mostra a foto de referência quando o pedido tem uma', async () => {
        servico.buscarSolicitacao.mockResolvedValue(solicitacao({
            fotos: [{ id: 'f1', url: '/api/fotos/s1/f1.jpg', tipo: 'image/jpeg', tamanho: 100 }],
        }));
        abrir();

        expect(await screen.findByRole('img', { name: 'Foto de referência: Roupas de frio para crianças' }))
            .toHaveAttribute('src', '/api/fotos/s1/f1.jpg');
    });

    it('para quem não é dono, não mostra editar nem cancelar', async () => {
        servico.buscarSolicitacao.mockResolvedValue(solicitacao({ souDono: false }));
        abrir();

        const acoes = await screen.findByRole('region', { name: 'Ações do pedido' });
        expect(within(acoes).getByRole('button', { name: 'Oferecer ajuda' })).toBeDisabled();
        expect(screen.queryByRole('link', { name: 'Editar pedido' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument();
    });

    it('o dono edita e cancela, com confirmação antes', async () => {
        servico.buscarSolicitacao.mockResolvedValue(solicitacao({ souDono: true }));
        servico.cancelarSolicitacao.mockResolvedValue(solicitacao({ souDono: true, situacao: 'CANCELADA' }));
        abrir();

        expect(await screen.findByRole('link', { name: 'Editar pedido' })).toHaveAttribute('href', '/pedidos/s1/editar');
        await userEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }));
        const dialogo = screen.getByRole('dialog', { name: 'Cancelar este pedido?' });
        expect(servico.cancelarSolicitacao).not.toHaveBeenCalled();

        await userEvent.click(within(dialogo).getByRole('button', { name: 'Sim, cancelar pedido' }));

        expect(await screen.findByText('Este pedido foi cancelado e não aparece mais para as pessoas.')).toBeInTheDocument();
        expect(servico.cancelarSolicitacao).toHaveBeenCalledWith('s1');
        expect(screen.queryByRole('link', { name: 'Editar pedido' })).not.toBeInTheDocument();
    });

    it('manter o pedido fecha a confirmação sem cancelar', async () => {
        servico.buscarSolicitacao.mockResolvedValue(solicitacao({ souDono: true }));
        abrir();

        await userEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }));
        await userEvent.click(screen.getByRole('button', { name: 'Manter pedido' }));

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(servico.cancelarSolicitacao).not.toHaveBeenCalled();
    });

    it('mostra o erro se o pedido não existir', async () => {
        servico.buscarSolicitacao.mockRejectedValue(new ApiError(404, 'Pedido não encontrado.'));
        abrir();

        expect(await screen.findByRole('alert')).toHaveTextContent('Não encontramos este pedido');
    });
});
