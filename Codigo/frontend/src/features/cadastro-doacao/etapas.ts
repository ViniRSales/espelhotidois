import type { ComponentType } from 'react';

import EtapaCategorias from './campos/EtapaCategorias';
import EtapaDetalhes from './campos/EtapaDetalhes';
import EtapaLocalizacao from './campos/EtapaLocalizacao';
import EtapaNomeMidia from './campos/EtapaNomeMidia';
import EtapaRevisao from './campos/EtapaRevisao';

type Etapa = {
  titulo: string;
  descricao: string;
  /** Dicas da coluna lateral; a revisão não tem lateral. */
  dicas?: string[];
  /** Campos da etapa. */
  Conteudo?: ComponentType;
};

/** Textos de cada etapa do assistente, na ordem de ETAPAS. */
export const CONTEUDO_ETAPAS: Etapa[] = [
  {
    titulo: 'Como se chama o seu item?',
    descricao: 'Dê um nome claro, conte como ele é e adicione fotos.',
    dicas: ['Use boa iluminação e um fundo neutro.', 'Mostre detalhes e possíveis defeitos.'],
    Conteudo: EtapaNomeMidia,
  },
  {
    titulo: 'Em que categoria ele se encaixa?',
    descricao: 'Categorias e tags ajudam o item a aparecer nas buscas e nas sugestões de quem precisa.',
    dicas: ['Escolha a categoria mais específica possível.', 'Tags também ajudam a encontrar pedidos parecidos.'],
    Conteudo: EtapaCategorias,
  },
  {
    titulo: 'Condição e entrega',
    descricao: 'Conte em que estado o item está e como prefere fazer a entrega.',
    dicas: ['Ser honesto sobre a condição gera confiança.', 'Ponto de encontro em local público é a opção mais segura.'],
    Conteudo: EtapaDetalhes,
  },
  {
    titulo: 'Onde o item está?',
    descricao: 'Informe só o bairro. Ele é usado para mostrar a distância aproximada para quem procura.',
    dicas: ['A distância é sempre aproximada para quem vê o anúncio.', 'Combine o local exato só pelo chat.'],
    Conteudo: EtapaLocalizacao,
  },
  {
    titulo: 'Revise e publique',
    descricao: 'Confira como o anúncio vai aparecer. Você pode editar qualquer parte antes de publicar.',
    Conteudo: EtapaRevisao,
  },
];
