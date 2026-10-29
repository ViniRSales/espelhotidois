import { CirclePlus, House, Menu, MessagesSquare, UserRound, type LucideIcon } from 'lucide-react';

export type ItemNavegacao = { rotulo: string; para: string; icone: LucideIcon };

/** Itens da navegação principal, iguais no cabeçalho (desktop) e na barra de baixo (celular). */
export const NAVEGACAO: ItemNavegacao[] = [
  { rotulo: 'Início', para: '/', icone: House },
  { rotulo: 'Bate-papo', para: '/bate-papo', icone: MessagesSquare },
  { rotulo: 'Adicionar', para: '/adicionar', icone: CirclePlus },
  { rotulo: 'Você', para: '/voce', icone: UserRound },
  { rotulo: 'Menu', para: '/menu', icone: Menu },
];
