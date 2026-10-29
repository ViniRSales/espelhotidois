import type { Doacao } from '@/types/doacao';

import { formularioVazio, type FormularioDoacao } from '../formulario';

export const HOJE = '2026-10-27';

export const ROUPAS = { id: 'cat-roupas', nome: 'Roupas' };
export const ALIMENTOS = { id: 'cat-alimentos', nome: 'Alimentos' };

export function foto(id: string) {
  return { id, url: `/api/fotos/d1/${id}.jpg`, tipo: 'image/jpeg', tamanho: 100 };
}

/** Formulário com tudo o que a publicação exige. */
export function formularioCompleto(campos: Partial<FormularioDoacao> = {}): FormularioDoacao {
  return {
    ...formularioVazio,
    titulo: 'Cachecol vermelho',
    descricao: 'Cachecol de lã, pouco usado.',
    fotos: [foto('f1')],
    categoriaId: ROUPAS.id,
    tags: ['inverno'],
    condicao: 'EXCELENTE',
    formasEntrega: ['A_COMBINAR'],
    bairro: 'Ipiranga',
    cidade: 'Belo Horizonte',
    ...campos,
  };
}

export function doacao(campos: Partial<Doacao> = {}): Doacao {
  return {
    id: 'd1',
    titulo: null,
    descricao: null,
    fotos: [],
    categoria: null,
    tags: [],
    condicao: null,
    formasEntrega: [],
    validade: null,
    naoPerecivel: null,
    localizacao: null,
    situacao: 'RASCUNHO',
    dataCadastro: '2026-10-27T15:00:00Z',
    atualizadaEm: '2026-10-27T15:00:00Z',
    publicadaEm: null,
    expiraEm: null,
    ...campos,
  };
}
