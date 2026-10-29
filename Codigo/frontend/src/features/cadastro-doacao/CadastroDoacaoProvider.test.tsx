import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/services/api';
import * as doacoes from '@/services/doacoes';
import type { Doacao } from '@/types/doacao';

import CadastroDoacaoProvider from './CadastroDoacaoProvider';
import { ALIMENTOS, doacao, foto, ROUPAS } from './testes/dados';
import { useCadastroDoacao } from './useCadastroDoacao';

vi.mock('@/services/doacoes');
vi.mock('@/hooks/useCategorias', () => ({
    useCategorias: () => ({ categorias: [ROUPAS, ALIMENTOS], carregando: false, erro: null }),
}));

const servico = vi.mocked(doacoes);

function montar(rascunho?: Doacao) {
    const wrapper = ({ children }: { children: ReactNode }) => (
        <CadastroDoacaoProvider rascunho={rascunho}>{children}</CadastroDoacaoProvider>
    );
    return renderHook(() => useCadastroDoacao(), { wrapper }).result;
}

function arquivo(nome: string, tipo = 'image/jpeg') {
    return new File(['x'], nome, { type: tipo });
}

describe('CadastroDoacaoProvider', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        servico.criarRascunho.mockImplementation(async (dados) => doacao({ titulo: dados.titulo }));
        servico.atualizarRascunho.mockImplementation(async (_id, dados) => doacao({ titulo: dados.titulo }));
    });

    it('não avança com a etapa incompleta e mostra os erros', async () => {
        const cadastro = montar();

        await act(() => cadastro.current.continuar());

        expect(cadastro.current.estado.etapa).toBe(1);
        expect(cadastro.current.estado.erros).toHaveProperty('titulo');
        expect(servico.criarRascunho).not.toHaveBeenCalled();
    });

    it('cria o rascunho ao avançar a etapa 1 e atualiza nas seguintes', async () => {
        const cadastro = montar();
        act(() => cadastro.current.alterar({ titulo: 'Cachecol', descricao: 'De lã', fotos: [foto('f1')] }));

        await act(() => cadastro.current.continuar());
        expect(servico.criarRascunho).toHaveBeenCalledOnce();
        expect(cadastro.current.estado).toMatchObject({ id: 'd1', etapa: 2, sujo: false });

        act(() => cadastro.current.alterar({ categoriaId: ROUPAS.id }));
        await act(() => cadastro.current.continuar());
        expect(servico.atualizarRascunho).toHaveBeenCalledWith('d1', expect.objectContaining({ categoriaId: ROUPAS.id }));
        expect(cadastro.current.estado.etapa).toBe(3);
    });

    it('mostra no campo o erro devolvido pela API', async () => {
        servico.atualizarRascunho.mockRejectedValue(
            new ApiError(400, 'Confira os campos destacados e tente de novo.', [{ campo: 'localizacao.bairro', mensagem: 'O bairro pode ter até 60 caracteres.' }]),
        );
        const cadastro = montar(doacao({ titulo: 'Cachecol' }));

        await act(() => cadastro.current.salvarRascunho());

        expect(cadastro.current.estado.erros.bairro).toBe('O bairro pode ter até 60 caracteres.');
        expect(cadastro.current.estado.erroGeral).toBe('Confira os campos destacados e tente de novo.');
    });

    it('a primeira foto cria o rascunho antes do envio', async () => {
        servico.enviarFoto.mockImplementation(async (_id, a) => foto(a.name));
        const cadastro = montar();

        await act(() => cadastro.current.adicionarFotos([arquivo('a'), arquivo('b')]));

        expect(servico.criarRascunho).toHaveBeenCalledOnce();
        expect(servico.enviarFoto).toHaveBeenCalledTimes(2);
        expect(cadastro.current.estado.formulario.fotos.map((f) => f.id)).toEqual(['a', 'b']);
        expect(cadastro.current.estado.enviandoFotos).toBe(0);
    });

    it('recusa arquivos que não são foto sem chamar a API', async () => {
        const cadastro = montar();

        await act(() => cadastro.current.adicionarFotos([arquivo('a.gif', 'image/gif')]));

        expect(cadastro.current.estado.erros.fotos).toBe('Use fotos JPG, PNG ou WEBP de até 5 MB.');
        expect(servico.criarRascunho).not.toHaveBeenCalled();
    });

    it('tornar capa move a foto para o início', () => {
        const cadastro = montar(doacao({ fotos: [foto('a'), foto('b'), foto('c')] }));

        act(() => cadastro.current.tornarCapa('c'));

        expect(cadastro.current.estado.formulario.fotos.map((f) => f.id)).toEqual(['c', 'a', 'b']);
        expect(cadastro.current.estado.sujo).toBe(true);
    });

    it('trocar de categoria limpa a validade', () => {
        const cadastro = montar();
        act(() => cadastro.current.alterar({ categoriaId: ALIMENTOS.id }));
        expect(cadastro.current.ehAlimento).toBe(true);
        act(() => cadastro.current.alterar({ validade: '2026-12-01', naoPerecivel: true }));

        act(() => cadastro.current.alterar({ categoriaId: ROUPAS.id }));

        expect(cadastro.current.ehAlimento).toBe(false);
        expect(cadastro.current.estado.formulario).toMatchObject({ validade: '', naoPerecivel: false });
    });

    it('publicar com algo faltando leva à etapa pendente', async () => {
        const cadastro = montar(doacao({ titulo: 'Cachecol', descricao: 'De lã', fotos: [foto('f1')], categoria: ROUPAS }));

        await act(() => cadastro.current.publicar());

        expect(cadastro.current.estado.etapa).toBe(3);
        expect(cadastro.current.estado.erros).toHaveProperty('condicao');
        expect(servico.publicarDoacao).not.toHaveBeenCalled();
    });

    it('publica um rascunho completo', async () => {
        servico.publicarDoacao.mockResolvedValue(doacao({ situacao: 'DISPONIVEL' }));
        const cadastro = montar(doacao({
            titulo: 'Cachecol', descricao: 'De lã', fotos: [foto('f1')], categoria: ROUPAS, condicao: 'BOM',
            formasEntrega: ['A_COMBINAR'], localizacao: { bairro: 'Ipiranga', cidade: 'Belo Horizonte' },
        }));
        expect(cadastro.current.estado.etapa).toBe(5);

        let publicada: Doacao | null = null;
        await act(async () => {
            publicada = await cadastro.current.publicar();
        });

        expect(publicada).toMatchObject({ situacao: 'DISPONIVEL' });
        expect(servico.atualizarRascunho).not.toHaveBeenCalled();
    });

    it('descartar apaga o rascunho salvo', async () => {
        servico.descartarRascunho.mockResolvedValue(undefined);
        const cadastro = montar(doacao());

        await waitFor(async () => expect(await cadastro.current.descartar()).toBe(true));

        expect(servico.descartarRascunho).toHaveBeenCalledWith('d1');
    });
});
