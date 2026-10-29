import type { Doacao, Foto, RascunhoDoacao } from '@/types/doacao';

import { api } from './api';

/** Rascunho do usuário logado, ou `undefined` se ele não tiver nenhum (204). */
export function buscarRascunho() {
  return api<Doacao | undefined>('/doacoes/rascunho');
}

export function criarRascunho(dados: RascunhoDoacao) {
  return api<Doacao>('/doacoes', { method: 'POST', body: dados });
}

export function atualizarRascunho(id: string, dados: RascunhoDoacao) {
  return api<Doacao>(`/doacoes/${id}`, { method: 'PUT', body: dados });
}

/** Apaga o rascunho e as fotos dele. */
export function descartarRascunho(id: string) {
  return api<void>(`/doacoes/${id}`, { method: 'DELETE' });
}

export function enviarFoto(id: string, arquivo: File) {
  const formulario = new FormData();
  formulario.append('arquivo', arquivo);
  return api<Foto>(`/doacoes/${id}/fotos`, { method: 'POST', body: formulario });
}

export function removerFoto(id: string, fotoId: string) {
  return api<void>(`/doacoes/${id}/fotos/${fotoId}`, { method: 'DELETE' });
}

export function publicarDoacao(id: string) {
  return api<Doacao>(`/doacoes/${id}/publicar`, { method: 'POST' });
}

export function buscarDoacao(id: string) {
  return api<Doacao>(`/doacoes/${id}`);
}
