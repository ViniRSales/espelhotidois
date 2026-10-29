import type { Categoria } from '@/services/categorias';

import type { Foto, Localizacao } from './doacao';

export type Urgencia = 'BAIXA' | 'MEDIA' | 'ALTA';

export type SituacaoSolicitacao = 'ABERTA' | 'ATENDIDA' | 'CANCELADA';

/**
 * Solicitação (pedido) como a API devolve (SolicitacaoResposta). Não traz quem pediu nem contatos;
 * `souDono` diz se o usuário logado é o autor, para mostrar editar e cancelar.
 */
export type Solicitacao = {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: Categoria | null;
  urgencia: Urgencia;
  localizacao: Localizacao | null;
  /** Foto de referência opcional (no máximo uma). */
  fotos: Foto[];
  situacao: SituacaoSolicitacao;
  dataCadastro: string;
  atualizadaEm: string;
  souDono: boolean;
};

/** Dados enviados ao cadastrar ou editar (SolicitacaoRequisicao). Obrigatórios: título, categoria e urgência. */
export type SolicitacaoRequisicao = {
  titulo: string;
  descricao: string | null;
  categoriaId: string | null;
  urgencia: Urgencia | null;
  localizacao: Localizacao | null;
};

type Opcao<T> = { valor: T; rotulo: string; descricao: string };

/** Opções de urgência, na ordem de escolha. A API só conhece o valor. */
export const URGENCIAS: Opcao<Urgencia>[] = [
  { valor: 'BAIXA', rotulo: 'Sem pressa', descricao: 'Posso esperar algumas semanas' },
  { valor: 'MEDIA', rotulo: 'Em breve', descricao: 'Preciso nos próximos dias' },
  { valor: 'ALTA', rotulo: 'Urgente', descricao: 'Preciso o quanto antes' },
];

export function rotuloUrgencia(urgencia: Urgencia | null) {
  return URGENCIAS.find((opcao) => opcao.valor === urgencia)?.rotulo;
}
