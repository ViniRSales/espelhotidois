import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CALCADOS, ROUPAS, solicitacao } from '@/features/solicitacao/testes/dados';
import { ApiError } from '@/services/api';
import * as solicitacoes from '@/services/solicitacoes';

import NovaSolicitacao from './NovaSolicitacao';

vi.mock('@/services/solicitacoes');
vi.mock('@/hooks/useCategorias', () => ({
    useCategorias: () => ({ categorias: [ROUPAS, CALCADOS], carregando: false, erro: null }),
}));

const servico = vi.mocked(solicitacoes);

function abrir() {
    const router = createMemoryRouter(
        [
            { path: '/adicionar/pedido', element: <NovaSolicitacao /> },
            { path: '/adicionar/pedido/:id/publicado', element: <p>Pedido publicado</p> },
            { path: '/adicionar', element: <p>Tela Adicionar</p> },
        ],
        { initialEntries: ['/adicionar/pedido'] },
    );
    render(<RouterProvider router={router} />);
    return router;
}

async function continuar() {
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
}

/** Preenche as duas primeiras etapas e chega à revisão. */
async function chegarNaRevisao() {
    await userEvent.type(screen.getByLabelText('Título'), 'Roupas de frio para crianças');
    await continuar();
    await userEvent.click(await screen.findByRole('radio', { name: 'Roupas' }));
    await userEvent.click(screen.getByRole('radio', { name: /Urgente/ }));
    await userEvent.type(screen.getByLabelText('Bairro'), 'Ipiranga');
    await continuar();
    expect(await screen.findByRole('heading', { name: 'Tudo certo para publicar?' })).toBeInTheDocument();
}

describe('NovaSolicitacao', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        // O jsdom não implementa as URLs de prévia de arquivos.
        URL.createObjectURL = vi.fn(() => 'blob:previa');
        URL.revokeObjectURL = vi.fn();
    });

    it('não avança sem título e mostra o erro junto ao campo', async () => {
        abrir();

        await continuar();

        expect(screen.getByRole('heading', { name: 'Do que você precisa?' })).toBeInTheDocument();
        expect(screen.getByLabelText('Título')).toHaveAccessibleDescription(/pelo menos 3 letras/);
        expect(screen.getByRole('alert')).toHaveTextContent('Falta pouco');
    });

    it('cobra categoria e urgência, mas não a localização', async () => {
        abrir();
        await userEvent.type(screen.getByLabelText('Título'), 'Fraldas');
        await continuar();

        await continuar();

        expect(await screen.findByText('Escolha uma categoria da lista.')).toBeInTheDocument();
        expect(screen.getByText('Escolha para quando você precisa.')).toBeInTheDocument();
        expect(screen.queryByText(/bairro pode ter/)).not.toBeInTheDocument();
    });

    it('revisa e publica, levando à confirmação', async () => {
        servico.cadastrarSolicitacao.mockResolvedValue(solicitacao({ souDono: true }));
        const router = abrir();
        await chegarNaRevisao();

        expect(screen.getByText('Urgente · Preciso o quanto antes')).toBeInTheDocument();
        // O bairro aparece no cartão de pré-visualização e no resumo.
        expect(screen.getAllByText('Ipiranga')).toHaveLength(2);
        await userEvent.click(screen.getByRole('button', { name: 'Publicar pedido' }));

        expect(await screen.findByText('Pedido publicado')).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/adicionar/pedido/s1/publicado');
        expect(servico.cadastrarSolicitacao).toHaveBeenCalledWith({
            titulo: 'Roupas de frio para crianças',
            descricao: null,
            categoriaId: ROUPAS.id,
            urgencia: 'ALTA',
            localizacao: { bairro: 'Ipiranga', cidade: '' },
        });
    });

    it('volta para o campo apontado pela API quando ela recusa os dados', async () => {
        servico.cadastrarSolicitacao.mockRejectedValue(new ApiError(400, 'Confira os campos destacados e tente de novo.', [
            { campo: 'titulo', mensagem: 'O título pode ter até 90 caracteres.' },
        ]));
        abrir();
        await chegarNaRevisao();

        await userEvent.click(screen.getByRole('button', { name: 'Publicar pedido' }));

        expect(await screen.findByRole('heading', { name: 'Do que você precisa?' })).toBeInTheDocument();
        expect(screen.getByText('O título pode ter até 90 caracteres.')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent('Confira os campos destacados');
    });

    it('Cancelar volta para a tela Adicionar', async () => {
        const router = abrir();

        await userEvent.click(screen.getByRole('link', { name: 'Cancelar' }));

        await waitFor(() => expect(router.state.location.pathname).toBe('/adicionar'));
    });

    describe('foto de referência', () => {
        const casaco = new File(['x'], 'casaco.jpg', { type: 'image/jpeg' });

        async function escolherFotoEPublicar() {
            await userEvent.upload(screen.getByTestId('seletor-foto'), casaco);
            expect(screen.getByRole('img', { name: 'Foto de referência escolhida' })).toHaveAttribute('src', 'blob:previa');
            await chegarNaRevisao();
            await userEvent.click(screen.getByRole('button', { name: 'Publicar pedido' }));
        }

        it('envia a foto escolhida depois de criar o pedido', async () => {
            servico.cadastrarSolicitacao.mockResolvedValue(solicitacao({ souDono: true }));
            const router = abrir();

            await escolherFotoEPublicar();

            expect(await screen.findByText('Pedido publicado')).toBeInTheDocument();
            expect(servico.enviarFotoSolicitacao).toHaveBeenCalledWith('s1', casaco);
            expect(router.state.location.state).toBeNull();
        });

        it('se só a foto falhar, publica o pedido e avisa', async () => {
            servico.cadastrarSolicitacao.mockResolvedValue(solicitacao({ souDono: true }));
            servico.enviarFotoSolicitacao.mockRejectedValue(new ApiError(400, 'Envie fotos em JPG, PNG ou WEBP.'));
            const router = abrir();

            await escolherFotoEPublicar();

            expect(await screen.findByText('Pedido publicado')).toBeInTheDocument();
            expect(router.state.location.state).toEqual({
                aviso: 'Seu pedido foi publicado, mas a foto não foi enviada. Envie fotos em JPG, PNG ou WEBP. Você pode adicioná-la editando o pedido.',
            });
        });

        it('a foto pode ser removida antes de publicar', async () => {
            abrir();
            await userEvent.upload(screen.getByTestId('seletor-foto'), casaco);

            await userEvent.click(screen.getByRole('button', { name: 'Remover a foto' }));

            expect(screen.queryByRole('img', { name: 'Foto de referência escolhida' })).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Escolher foto' })).toBeInTheDocument();
        });
    });
});
