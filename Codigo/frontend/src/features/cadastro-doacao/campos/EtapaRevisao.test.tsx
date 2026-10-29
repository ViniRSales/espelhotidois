import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Doacao } from '@/types/doacao';

import CadastroDoacaoProvider from '../CadastroDoacaoProvider';
import { ALIMENTOS, doacao, foto, ROUPAS } from '../testes/dados';
import { useCadastroDoacao } from '../useCadastroDoacao';
import EtapaRevisao from './EtapaRevisao';

vi.mock('@/services/doacoes');
vi.mock('@/hooks/useCategorias', () => ({
    useCategorias: () => ({ categorias: [ROUPAS, ALIMENTOS], carregando: false, erro: null }),
}));

function EtapaAtual() {
    const { estado } = useCadastroDoacao();
    return <p>Etapa atual: {estado.etapa}</p>;
}

function completo(campos: Partial<Doacao> = {}) {
    return doacao({
        titulo: 'Cachecol vermelho', descricao: 'De lã', fotos: [foto('a'), foto('b')], categoria: ROUPAS,
        tags: ['inverno', 'lã'], condicao: 'EXCELENTE', formasEntrega: ['A_COMBINAR', 'PONTO_DE_ENCONTRO'],
        localizacao: { bairro: 'Savassi', cidade: 'Belo Horizonte' }, ...campos,
    });
}

function montar(rascunho: Doacao) {
    render(
        <CadastroDoacaoProvider rascunho={rascunho}>
            <EtapaRevisao />
            <EtapaAtual />
        </CadastroDoacaoProvider>,
    );
}

describe('EtapaRevisao', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 9, 27, 10));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('resume tudo o que foi preenchido', () => {
        montar(completo());

        expect(screen.getByText('Cachecol vermelho · 2 fotos')).toBeInTheDocument();
        expect(screen.getByText('Roupas · Tags: inverno, lã')).toBeInTheDocument();
        expect(screen.getByText('Excelente · A combinar, Ponto de encontro')).toBeInTheDocument();
        expect(screen.getByText('30 dias a partir da publicação (até 26/11/2026)')).toBeInTheDocument();
        expect(screen.getByText('Savassi · Belo Horizonte')).toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'Como seu anúncio vai aparecer' })).toBeInTheDocument();
    });

    it('mostra a validade de alimentos', () => {
        montar(completo({ categoria: ALIMENTOS, tags: [], validade: '2026-11-10', naoPerecivel: false }));

        expect(screen.getByText('Alimentos · Validade: 10/11/2026')).toBeInTheDocument();
    });

    it('"Editar" leva à etapa daquela parte', async () => {
        montar(completo());
        expect(screen.getByText('Etapa atual: 5')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Editar localização' }));

        expect(screen.getByText('Etapa atual: 4')).toBeInTheDocument();
    });
});
