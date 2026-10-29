import { createContext } from 'react';

import type { DadosCadastro, DadosLogin, Usuario } from '@/types/autenticacao';

/** `verificando`: há um token salvo e a API ainda está confirmando se ele vale. */
export type SituacaoSessao = 'verificando' | 'logado' | 'visitante';

export type Autenticacao = {
  situacao: SituacaoSessao;
  usuario: Usuario | null;
  /** A pessoa clicou em "Sair" (e não teve a sessão expirada): telas protegidas levam à Home, não ao login. */
  saiu: boolean;
  /** Lança `ApiError` se a API recusar (senha errada, sem conexão). */
  entrar: (dados: DadosLogin) => Promise<void>;
  /** Cria a conta e já entra. Lança `ApiError` se a API recusar. */
  cadastrar: (dados: DadosCadastro) => Promise<void>;
  /** Revoga o token na API e apaga a sessão local, mesmo sem conexão. */
  sair: () => Promise<void>;
};

export const AutenticacaoContext = createContext<Autenticacao | null>(null);
