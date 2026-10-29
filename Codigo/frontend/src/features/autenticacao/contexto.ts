import { createContext } from 'react';

import type { DadosCadastro, DadosLogin, Usuario } from '@/types/autenticacao';

export type SituacaoSessao = 'verificando' | 'logado' | 'visitante';

export type Autenticacao = {
  situacao: SituacaoSessao;
  usuario: Usuario | null;
  saiu: boolean;
  entrar: (dados: DadosLogin) => Promise<void>;
  cadastrar: (dados: DadosCadastro) => Promise<void>;
  sair: () => Promise<void>;
};

export const AutenticacaoContext = createContext<Autenticacao | null>(null);
