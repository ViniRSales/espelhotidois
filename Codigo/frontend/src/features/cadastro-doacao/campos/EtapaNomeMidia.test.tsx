import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as doacoes from '@/services/doacoes';
import type { Doacao } from '@/types/doacao';

import CadastroDoacaoProvider from '../CadastroDoacaoProvider';
import PreviaAnuncio from '../PreviaAnuncio';
import { ALIMENTOS, doacao, foto, ROUPAS } from '../testes/dados';
import { useCadastroDoacao } from '../useCadastroDoacao';
import EtapaNomeMidia from './EtapaNomeMidia';

vi.mock('@/services/doacoes');
vi.mock('@/hooks/useCategorias', () => ({
    useCategorias: () => ({ categorias: [ROUPAS, ALIMENTOS], carregando: false, erro: null }),
}));

const servico = vi.mocked(doacoes);

function montar(rascunho?: Doacao) {
    render(
        <CadastroDoacaoProvider rascunho={rascunho}>
            <EtapaNomeMidia />
            <PreviaAnuncio />
        </CadastroDoacaoProvider>,
    );
}

describe('EtapaNomeMidia', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        servico.criarRascunho.mockResolvedValue(doacao());
    });

    it('nome e descrição aparecem na prévia, com contador', async () => {
        montar();

        await userEvent.type(screen.getByLabelText('Nome do item'), 'Cachecol vermelho');
        await userEvent.type(screen.getByLabelText('Descrição'), 'De lã');

        const previa = screen.getByRole('region', { name: 'Pré-visualização do anúncio' });
        expect(within(previa).getByRole('heading', { name: 'Cachecol vermelho' })).toBeInTheDocument();
        expect(within(previa).getByText('De lã')).toBeInTheDocument();
        expect(screen.getByText('17/90')).toBeInTheDocument();
    });

    it('envia as fotos escolhidas e marca a primeira como capa', async () => {
        servico.enviarFoto.mockImplementation(async (_id, arquivo) => foto(arquivo.name));
        montar();

        await userEvent.upload(screen.getByTestId('seletor-fotos'), [
            new File(['a'], 'a', { type: 'image/jpeg' }),
            new File(['b'], 'b', { type: 'image/png' }),
        ]);

        const lista = await screen.findByRole('list', { name: 'Fotos adicionadas' });
        await waitFor(() => expect(within(lista).getAllByRole('img')).toHaveLength(2));
        expect(within(lista).getByText('Capa')).toBeInTheDocument();
        expect(within(lista).getByRole('img', { name: 'Foto 1 (capa)' })).toHaveAttribute('src', '/api/fotos/d1/a.jpg');
        expect(servico.criarRascunho).toHaveBeenCalledOnce();
    });

    it('troca a capa e remove fotos', async () => {
        servico.removerFoto.mockResolvedValue(undefined);
        montar(doacao({ fotos: [foto('a'), foto('b')] }));

        await userEvent.click(screen.getByRole('button', { name: 'Usar a foto 2 como capa' }));
        expect(screen.getByRole('img', { name: 'Foto 1 (capa)' })).toHaveAttribute('src', '/api/fotos/d1/b.jpg');

        await userEvent.click(screen.getByRole('button', { name: 'Remover a foto 2' }));
        await waitFor(() => expect(screen.getAllByRole('img', { name: /Foto/ })).toHaveLength(1));
        expect(servico.removerFoto).toHaveBeenCalledWith('d1', 'a');
    });

    it('ao avançar vazia, mostra os erros nos campos', async () => {
        function Avancar() {
            const { continuar } = useCadastroDoacao();
            return <button type='button' onClick={() => void continuar()}>Continuar</button>;
        }
        render(
            <CadastroDoacaoProvider>
                <EtapaNomeMidia />
                <Avancar />
            </CadastroDoacaoProvider>,
        );

        await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

        expect(screen.getByLabelText('Nome do item')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('Nome do item')).toHaveAccessibleDescription('Dê um nome ao item com pelo menos 3 letras.');
        expect(screen.getByLabelText('Descrição')).toHaveAccessibleDescription('Conte um pouco sobre o item.');
        expect(screen.getByRole('alert')).toHaveTextContent('Adicione pelo menos uma foto do item.');
        expect(servico.criarRascunho).not.toHaveBeenCalled();
    });
});
