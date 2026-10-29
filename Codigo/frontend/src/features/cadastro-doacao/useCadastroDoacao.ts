import { useContext } from 'react';

import { CadastroDoacaoContext } from './contexto';

/** Estado e ações do assistente de cadastro; só funciona dentro do CadastroDoacaoProvider. */
export function useCadastroDoacao() {
  const contexto = useContext(CadastroDoacaoContext);
  if (!contexto) {
    throw new Error('useCadastroDoacao precisa estar dentro de CadastroDoacaoProvider.');
  }
  return contexto;
}
