import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CadastroDoacaoProvider from '../CadastroDoacaoProvider';
import { ALIMENTOS, doacao, foto, ROUPAS } from '../testes/dados';
import { useCadastroDoacao } from '../useCadastroDoacao';
import EtapaCategorias from './EtapaCategorias';

vi.mock('@/services/doacoes');
vi.mock('@/hooks/useCategorias', () => ({
    useCategorias: () => ({ categorias: [ROUPAS, ALIMENTOS], carregando: false, erro: null }),
}));

function Avancar() {
    const { continuar } = useCadastroDoacao();
    return <button type='button' onClick={() => void continuar()}>Continuar</button>;
}

/** Rascunho com a etapa 1 preenchida: o assistente abre na etapa 2. */
function montar() {
    render(
        <CadastroDoacaoProvider rascunho={doacao({ titulo: 'Cesta básica', descricao: 'Arroz e feijão', fotos: [foto('f1')] })}>
            <EtapaCategorias />
            <Avancar />
        </CadastroDoacaoProvider>,
    );
}

describe('EtapaCategorias', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('mostra a validade só para alimentos', async () => {
        montar();

        await userEvent.click(screen.getByText('Roupas'));
        expect(screen.queryByLabelText('Data de validade')).not.toBeInTheDocument();

        await userEvent.click(screen.getByText('Alimentos'));
        expect(screen.getByLabelText('Data de validade')).toBeEnabled();
    });

    it('"Não perecível" desativa e limpa a data de validade', async () => {
        montar();
        await userEvent.click(screen.getByText('Alimentos'));
        await userEvent.type(screen.getByLabelText('Data de validade'), '2099-12-31');

        await userEvent.click(screen.getByRole('switch', { name: 'Não perecível' }));

        expect(screen.getByLabelText('Data de validade')).toBeDisabled();
        expect(screen.getByLabelText('Data de validade')).toHaveValue('');
    });

    it('exige a validade de alimento perecível ao avançar', async () => {
        montar();
        await userEvent.click(screen.getByText('Alimentos'));

        await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

        expect(screen.getByLabelText('Data de validade'))
            .toHaveAccessibleDescription(expect.stringContaining('Informe a validade ou marque como não perecível.'));
    });

    it('exige a categoria ao avançar', async () => {
        montar();

        await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

        expect(screen.getByText('Escolha uma categoria.')).toBeInTheDocument();
    });

    it('sugere tags da categoria escolhida', async () => {
        montar();
        await userEvent.click(screen.getByText('Roupas'));

        await userEvent.click(screen.getByRole('button', { name: 'Adicionar a tag inverno' }));

        expect(within(screen.getByRole('list', { name: 'Tags adicionadas' })).getByText('inverno')).toBeInTheDocument();
    });
});
