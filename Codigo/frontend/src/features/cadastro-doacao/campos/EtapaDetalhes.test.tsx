import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CadastroDoacaoProvider from '../CadastroDoacaoProvider';
import PreviaAnuncio from '../PreviaAnuncio';
import { ALIMENTOS, doacao, foto, ROUPAS } from '../testes/dados';
import { useCadastroDoacao } from '../useCadastroDoacao';
import EtapaDetalhes from './EtapaDetalhes';

vi.mock('@/services/doacoes');
vi.mock('@/hooks/useCategorias', () => ({
    useCategorias: () => ({ categorias: [ROUPAS, ALIMENTOS], carregando: false, erro: null }),
}));

function Avancar() {
    const { continuar } = useCadastroDoacao();
    return <button type='button' onClick={() => void continuar()}>Continuar</button>;
}

/** Rascunho com as etapas 1 e 2 preenchidas: o assistente abre na etapa 3. */
function montar() {
    render(
        <CadastroDoacaoProvider rascunho={doacao({ titulo: 'Cachecol', descricao: 'De lã', fotos: [foto('f1')], categoria: ROUPAS })}>
            <EtapaDetalhes />
            <PreviaAnuncio />
            <Avancar />
        </CadastroDoacaoProvider>,
    );
}

describe('EtapaDetalhes', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 9, 27, 10));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('escolhe uma condição e várias formas de entrega', async () => {
        montar();

        await userEvent.click(screen.getByRole('radio', { name: /Excelente/ }));
        await userEvent.click(screen.getByRole('checkbox', { name: /A combinar/ }));
        await userEvent.click(screen.getByRole('checkbox', { name: /Ponto de encontro/ }));
        await userEvent.click(screen.getByRole('checkbox', { name: /A combinar/ }));

        expect(screen.getByRole('radio', { name: /Excelente/ })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: /Ponto de encontro/ })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: /A combinar/ })).not.toBeChecked();
        const previa = screen.getByRole('region', { name: 'Pré-visualização do anúncio' });
        expect(within(previa).getByText('Excelente')).toBeInTheDocument();
        expect(within(previa).getByText('Ponto de encontro')).toBeInTheDocument();
    });

    it('mostra o prazo de 30 dias a partir de hoje', () => {
        montar();

        expect(screen.getByText('Disponível por 30 dias — até 26/11/2026')).toBeInTheDocument();
    });

    it('exige condição e forma de entrega ao avançar', async () => {
        montar();

        await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

        expect(screen.getByText('Conte em que estado o item está.')).toBeInTheDocument();
        expect(screen.getByText('Escolha pelo menos uma forma de entrega.')).toBeInTheDocument();
    });
});
