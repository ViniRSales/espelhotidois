import type { Categoria } from '@/services/categorias';

export type Condicao = 'NOVO' | 'EXCELENTE' | 'BOM' | 'USADO';

export type FormaEntrega = 'A_COMBINAR' | 'RETIRADA_NO_LOCAL' | 'PONTO_DE_ENCONTRO' | 'POSSO_ENTREGAR';

export type SituacaoDoacao = 'RASCUNHO' | 'DISPONIVEL' | 'RESERVADA' | 'A_CAMINHO' | 'ENTREGUE' | 'CANCELADA' | 'EXPIRADA';

export type Localizacao = { bairro: string | null; cidade: string | null };

export type Foto = { id: string; url: string; tipo: string; tamanho: number };

/** Doação como a API devolve (DoacaoResposta). */
export type Doacao = {
  id: string;
  titulo: string | null;
  descricao: string | null;
  fotos: Foto[];
  categoria: Categoria | null;
  tags: string[];
  condicao: Condicao | null;
  formasEntrega: FormaEntrega[];
  validade: string | null;
  naoPerecivel: boolean | null;
  localizacao: Localizacao | null;
  situacao: SituacaoDoacao;
  dataCadastro: string;
  atualizadaEm: string;
  publicadaEm: string | null;
  expiraEm: string | null;
};

/** Estado do rascunho enviado à API (DoacaoRascunhoRequisicao). */
export type RascunhoDoacao = {
  titulo: string | null;
  descricao: string | null;
  ordemFotos: string[];
  categoriaId: string | null;
  tags: string[];
  condicao: Condicao | null;
  formasEntrega: FormaEntrega[];
  validade: string | null;
  naoPerecivel: boolean | null;
  localizacao: Localizacao | null;
};

type Opcao<T> = { valor: T; rotulo: string; descricao: string };

/** Opções de condição, com os textos do wireframe. */
export const CONDICOES: Opcao<Condicao>[] = [
  { valor: 'NOVO', rotulo: 'Novo', descricao: 'Nunca foi usado' },
  { valor: 'EXCELENTE', rotulo: 'Excelente', descricao: 'Sem sinais de uso' },
  { valor: 'BOM', rotulo: 'Bom', descricao: 'Pequenos sinais de uso' },
  { valor: 'USADO', rotulo: 'Usado', descricao: 'Sinais de uso visíveis' },
];

/** Formas de entrega, com os textos do wireframe. */
export const FORMAS_ENTREGA: Opcao<FormaEntrega>[] = [
  { valor: 'A_COMBINAR', rotulo: 'A combinar', descricao: 'Vocês decidem pelo bate-papo' },
  { valor: 'RETIRADA_NO_LOCAL', rotulo: 'Retirada no local', descricao: 'A pessoa busca no seu bairro' },
  { valor: 'PONTO_DE_ENCONTRO', rotulo: 'Ponto de encontro', descricao: 'Em um local público combinado' },
  { valor: 'POSSO_ENTREGAR', rotulo: 'Posso entregar', descricao: 'Você leva até a pessoa' },
];

export function rotuloCondicao(condicao: Condicao | null) {
  return CONDICOES.find((opcao) => opcao.valor === condicao)?.rotulo;
}

export function rotuloFormaEntrega(forma: FormaEntrega) {
  return FORMAS_ENTREGA.find((opcao) => opcao.valor === forma)?.rotulo ?? forma;
}
