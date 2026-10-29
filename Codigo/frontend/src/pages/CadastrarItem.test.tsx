import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ALIMENTOS, doacao, ROUPAS } from '@/features/cadastro-doacao/testes/dados';
import * as doacoes from '@/services/doacoes';

import CadastrarItem from './CadastrarItem';

vi.mock('@/services/doacoes');
vi.mock('@/hooks/useCategorias', () => ({
    useCategorias: () => ({ categorias: [ROUPAS, ALIMENTOS], carregando: false, erro: null }),
}));

const servico = vi.mocked(doacoes);

function abrir(caminho: string) {
    const router = createMemoryRouter(
        [
            { path: '/adicionar/item/:id?', element: <CadastrarItem /> },
            { path: '/adicionar', element: <p>Tela Adicionar</p> },
            { path: '/doacoes/:id', element: <p>Página da doação</p> },
        ],
        { initialEntries: [caminho] },
    );
    render(<RouterProvider router={router} />);
    return router;
}

describe('CadastrarItem', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        servico.descartarRascunho.mockResolvedValue(undefined);
    });

    it('sem rascunho, começa na etapa 1 e sai sem perguntar', async () => {
        servico.buscarRascunho.mockResolvedValue(undefined);
        const router = abrir('/adicionar/item');

        expect(await screen.findByRole('heading', { name: 'Como se chama o seu item?' })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('link', { name: 'Cancelar' }));

        expect(await screen.findByText('Tela Adicionar')).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/adicionar');
    });

    it('oferece continuar o rascunho existente e leva a URL até ele', async () => {
        servico.buscarRascunho.mockResolvedValue(doacao({ titulo: 'Cachecol vermelho' }));
        const router = abrir('/adicionar/item');

        expect(await screen.findByText('Cachecol vermelho')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Continuar rascunho' }));

        expect(await screen.findByRole('heading', { name: 'Como se chama o seu item?' })).toBeInTheDocument();
        await waitFor(() => expect(router.state.location.pathname).toBe('/adicionar/item/d1'));
        expect(router.state.location.search).toBe('?etapa=1');
        // Mudar a URL não recarrega a página nem pergunta de novo sobre o rascunho.
        expect(screen.getByRole('heading', { name: 'Como se chama o seu item?' })).toBeInTheDocument();
        expect(screen.queryByText('Você tem um rascunho em andamento')).not.toBeInTheDocument();
        expect(servico.buscarRascunho).toHaveBeenCalledOnce();
    });

    it('começar de novo descarta o rascunho existente', async () => {
        servico.buscarRascunho.mockResolvedValue(doacao());
        abrir('/adicionar/item');

        await userEvent.click(await screen.findByRole('button', { name: 'Começar de novo' }));

        expect(servico.descartarRascunho).toHaveBeenCalledWith('d1');
        expect(await screen.findByRole('heading', { name: 'Como se chama o seu item?' })).toBeInTheDocument();
    });

    it('doação já publicada vai para a página dela', async () => {
        servico.buscarDoacao.mockResolvedValue(doacao({ situacao: 'DISPONIVEL' }));
        abrir('/adicionar/item/d1');

        expect(await screen.findByText('Página da doação')).toBeInTheDocument();
    });

    describe('ao sair com um rascunho', () => {
        beforeEach(() => {
            servico.buscarDoacao.mockResolvedValue(doacao());
        });

        async function tentarSair() {
            abrir('/adicionar/item/d1');
            const cancelar = await screen.findByRole('link', { name: 'Cancelar' });
            // O useBlocker só passa a valer uma renderização depois de montar. Sem esvaziar as renderizações
            // pendentes, o clique às vezes sai do cadastro antes de o bloqueio existir e o diálogo não abre.
            await act(async () => {});
            await userEvent.click(cancelar);
            return screen.findByRole('dialog', { name: 'Deseja descartar o rascunho?' });
        }

        it('Cancelar continua no cadastro', async () => {
            const dialogo = await tentarSair();

            await userEvent.click(screen.getAllByRole('button', { name: 'Cancelar' }).at(-1)!);

            await waitFor(() => expect(dialogo).not.toHaveAttribute('open'));
            expect(screen.getByRole('heading', { name: 'Como se chama o seu item?' })).toBeInTheDocument();
            expect(servico.descartarRascunho).not.toHaveBeenCalled();
        });

        it('Sim descarta e sai', async () => {
            await tentarSair();

            await userEvent.click(screen.getByRole('button', { name: 'Sim, descartar' }));

            expect(await screen.findByText('Tela Adicionar')).toBeInTheDocument();
            expect(servico.descartarRascunho).toHaveBeenCalledWith('d1');
        });

        it('Não mantém o rascunho e sai', async () => {
            await tentarSair();

            await userEvent.click(screen.getByRole('button', { name: 'Não, manter rascunho' }));

            expect(await screen.findByText('Tela Adicionar')).toBeInTheDocument();
            expect(servico.descartarRascunho).not.toHaveBeenCalled();
        });

        it('se descartar falhar, avisa e continua no diálogo', async () => {
            servico.descartarRascunho.mockRejectedValue(new Error('fora do ar'));
            await tentarSair();

            await userEvent.click(screen.getByRole('button', { name: 'Sim, descartar' }));

            expect(await screen.findByText('Não conseguimos descartar o rascunho. Tente de novo.')).toBeInTheDocument();
            expect(screen.queryByText('Tela Adicionar')).not.toBeInTheDocument();
        });
    });
});
