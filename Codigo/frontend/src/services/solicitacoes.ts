import type { Foto } from '@/types/doacao';
import type { Solicitacao, SolicitacaoRequisicao } from '@/types/solicitacao';

import { api } from './api';

export function cadastrarSolicitacao(dados: SolicitacaoRequisicao) {
  return api<Solicitacao>('/solicitacoes', { method: 'POST', body: dados });
}

export function buscarSolicitacao(id: string) {
  return api<Solicitacao>(`/solicitacoes/${encodeURIComponent(id)}`);
}

export function editarSolicitacao(id: string, dados: SolicitacaoRequisicao) {
  return api<Solicitacao>(`/solicitacoes/${encodeURIComponent(id)}`, { method: 'PUT', body: dados });
}

/** Encerra o pedido; ele continua existindo, mas deixa de aparecer para as pessoas. */
export function cancelarSolicitacao(id: string) {
  return api<Solicitacao>(`/solicitacoes/${encodeURIComponent(id)}/cancelar`, { method: 'POST' });
}

export function enviarFotoSolicitacao(id: string, arquivo: File) {
  const formulario = new FormData();
  formulario.append('arquivo', arquivo);
  return api<Foto>(`/solicitacoes/${encodeURIComponent(id)}/fotos`, { method: 'POST', body: formulario });
}

export function removerFotoSolicitacao(id: string, fotoId: string) {
  return api<void>(`/solicitacoes/${encodeURIComponent(id)}/fotos/${encodeURIComponent(fotoId)}`, { method: 'DELETE' });
}
