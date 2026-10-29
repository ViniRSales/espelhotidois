import { useContext } from 'react';

import { AutenticacaoContext } from './contexto';

export function useAutenticacao() {
  const contexto = useContext(AutenticacaoContext);
  if (!contexto) {
    throw new Error('useAutenticacao precisa estar dentro de AutenticacaoProvider.');
  }
  return contexto;
}
