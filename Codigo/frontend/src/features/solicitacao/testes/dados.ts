import type { Solicitacao } from '@/types/solicitacao';

import { FORMULARIO_VAZIO, type Formulario } from '../formulario';

export const ROUPAS = { id: 'cat-roupas', nome: 'Roupas' };
export const CALCADOS = { id: 'cat-calcados', nome: 'Calçados' };

/** Pedido aberto como a API devolve; `campos` sobrescreve o que for preciso. */
export function solicitacao(campos: Partial<Solicitacao> = {}): Solicitacao {
  return {
    id: 's1',
    titulo: 'Roupas de frio para crianças',
    descricao: 'Casacos para duas crianças, tamanhos 6 e 8.',
    categoria: ROUPAS,
    urgencia: 'ALTA',
    localizacao: { bairro: 'Ipiranga', cidade: 'Belo Horizonte' },
    fotos: [],
    situacao: 'ABERTA',
    dataCadastro: '2026-10-28T15:00:00Z',
    atualizadaEm: '2026-10-28T15:00:00Z',
    souDono: false,
    ...campos,
  };
}

/** Formulário com tudo o que é obrigatório. */
export function formularioCompleto(campos: Partial<Formulario> = {}): Formulario {
  return {
    ...FORMULARIO_VAZIO,
    titulo: 'Roupas de frio para crianças',
    categoriaId: ROUPAS.id,
    urgencia: 'ALTA',
    ...campos,
  };
}
