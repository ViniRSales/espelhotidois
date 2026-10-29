import { useContext } from 'react';

import { AutenticacaoContext } from './contexto';

/** Sessão da pessoa e as ações de entrar, cadastrar e sair; só funciona dentro do AutenticacaoProvider. */
export function useAutenticacao() {
  const contexto = useContext(AutenticacaoContext);
  if (!contexto) {
    throw new Error('useAutenticacao precisa estar dentro de AutenticacaoProvider.');
  }
  return contexto;
}
