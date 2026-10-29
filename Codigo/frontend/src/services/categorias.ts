import { api } from './api';

export type Categoria = { id: string; nome: string };

export function listarCategorias() {
  return api<Categoria[]>('/categorias');
}
