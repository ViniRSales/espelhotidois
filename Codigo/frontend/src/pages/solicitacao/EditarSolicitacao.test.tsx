import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CALCADOS, ROUPAS, solicitacao } from '@/features/solicitacao/testes/dados';
import * as solicitacoes from '@/services/solicitacoes';

import EditarSolicitacao from './EditarSolicitacao';

vi.mock('@/services/solicitacoes');
vi.mock('@/hooks/useCategorias', () => ({
    useCategorias: () => ({ categorias: [ROUPAS, CALCADOS], carregando: false, erro: null }),
}));

const servico = vi.mocked(solicitacoes);

function abrir() {
    const router = createMemoryRouter(
        [
            { path: '/pedidos/:id/editar', element: <EditarSolicitacao /> },
            { path: '/pedidos/:id', element: <p>Detalhe do pedido</p> },
        ],
        { initialEntries: ['/pedidos/s1/editar'] },
    );
    render(<RouterProvider router={router} />);
    return router;
}

describe('EditarSolicitacao', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('o dono altera o pedido e volta ao detalhe com um aviso', async () => {
        servico.buscarSolicitacao.mockResolvedValue(solicitacao({ souDono: true }));
        servico.editarSolicitacao.mockResolvedValue(solicitacao({ souDono: true, urgencia: 'MEDIA' }));
        const router = abrir();

        expect(await screen.findByLabelText('Título')).toHaveValue('Roupas de frio para crianças');
        // Na edição, dá para ir direto à etapa que se quer mudar.
        await userEvent.click(screen.getByRole('button', { name: /Etapa 2 de 3/ }));
        await userEvent.click(screen.getByRole('radio', { name: /Em breve/ }));
        await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Salvar alterações' }));

        expect(await screen.findByText('Detalhe do pedido')).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/pedidos/s1');
        expect(router.state.location.state).toEqual({ aviso: 'Pronto! Seu pedido foi atualizado.' });
        expect(servico.editarSolicitacao).toHaveBeenCalledWith('s1', expect.objectContaining({ urgencia: 'MEDIA' }));
    });

    it('quem não é dono não vê o formulário', async () => {
        servico.buscarSolicitacao.mockResolvedValue(solicitacao({ souDono: false }));
        abrir();

        expect(await screen.findByRole('heading', { name: 'Este pedido não pode ser editado' })).toBeInTheDocument();
        expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
    });

    it('pedido cancelado não pode ser editado', async () => {
        servico.buscarSolicitacao.mockResolvedValue(solicitacao({ souDono: true, situacao: 'CANCELADA' }));
        abrir();

        expect(await screen.findByRole('heading', { name: 'Este pedido não pode ser editado' })).toBeInTheDocument();
    });

    describe('foto de referência', () => {
        const salva = { id: 'f1', url: '/api/fotos/s1/f1.jpg', tipo: 'image/jpeg', tamanho: 100 };

        beforeEach(() => {
            // O jsdom não implementa as URLs de prévia de arquivos.
            URL.createObjectURL = vi.fn(() => 'blob:previa');
            URL.revokeObjectURL = vi.fn();
            servico.buscarSolicitacao.mockResolvedValue(solicitacao({ souDono: true, fotos: [salva] }));
            servico.editarSolicitacao.mockResolvedValue(solicitacao({ souDono: true }));
        });

        async function salvar() {
            await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
            await userEvent.click(await screen.findByRole('button', { name: 'Continuar' }));
            await userEvent.click(await screen.findByRole('button', { name: 'Salvar alterações' }));
            expect(await screen.findByText('Detalhe do pedido')).toBeInTheDocument();
        }

        it('mostra a foto salva e a remove ao salvar', async () => {
            abrir();
            expect(await screen.findByRole('img', { name: 'Foto de referência escolhida' })).toHaveAttribute('src', salva.url);

            await userEvent.click(screen.getByRole('button', { name: 'Remover a foto' }));
            await salvar();

            expect(servico.removerFotoSolicitacao).toHaveBeenCalledWith('s1', 'f1');
            expect(servico.enviarFotoSolicitacao).not.toHaveBeenCalled();
        });

        it('troca a foto: apaga a antiga e envia a nova', async () => {
            const nova = new File(['x'], 'tenis.png', { type: 'image/png' });
            abrir();
            await userEvent.click(await screen.findByRole('button', { name: 'Remover a foto' }));

            await userEvent.upload(screen.getByTestId('seletor-foto'), nova);
            await salvar();

            expect(servico.removerFotoSolicitacao).toHaveBeenCalledWith('s1', 'f1');
            expect(servico.enviarFotoSolicitacao).toHaveBeenCalledWith('s1', nova);
        });

        it('sem mexer na foto, não chama a API de fotos', async () => {
            abrir();
            await screen.findByRole('img', { name: 'Foto de referência escolhida' });

            await salvar();

            expect(servico.removerFotoSolicitacao).not.toHaveBeenCalled();
            expect(servico.enviarFotoSolicitacao).not.toHaveBeenCalled();
        });
    });
});
