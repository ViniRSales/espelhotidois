import type { Condicao, Doacao, FormaEntrega, Foto, RascunhoDoacao } from '@/types/doacao';

/** Dados do assistente de cadastro, no formato dos campos da tela. */
export type FormularioDoacao = {
  titulo: string;
  descricao: string;
  fotos: Foto[];
  categoriaId: string | null;
  tags: string[];
  condicao: Condicao | null;
  formasEntrega: FormaEntrega[];
  /** Data no formato do input (`aaaa-mm-dd`) ou vazia. */
  validade: string;
  naoPerecivel: boolean;
  bairro: string;
  cidade: string;
};

export type CampoFormulario = keyof FormularioDoacao;

/** Mensagens de erro por campo do formulário. */
export type Erros = Partial<Record<CampoFormulario, string>>;

export const formularioVazio: FormularioDoacao = {
  titulo: '',
  descricao: '',
  fotos: [],
  categoriaId: null,
  tags: [],
  condicao: null,
  formasEntrega: [],
  validade: '',
  naoPerecivel: false,
  bairro: '',
  cidade: '',
};

export function formularioDaDoacao(doacao: Doacao): FormularioDoacao {
  return {
    titulo: doacao.titulo ?? '',
    descricao: doacao.descricao ?? '',
    fotos: doacao.fotos,
    categoriaId: doacao.categoria?.id ?? null,
    tags: doacao.tags,
    condicao: doacao.condicao,
    formasEntrega: doacao.formasEntrega,
    validade: doacao.validade ?? '',
    naoPerecivel: doacao.naoPerecivel ?? false,
    bairro: doacao.localizacao?.bairro ?? '',
    cidade: doacao.localizacao?.cidade ?? '',
  };
}

/** Converte para o corpo do PUT/POST; textos vazios vão como `null`. */
export function rascunhoDoFormulario(formulario: FormularioDoacao): RascunhoDoacao {
  const texto = (valor: string) => valor.trim() || null;
  const bairro = texto(formulario.bairro);
  const cidade = texto(formulario.cidade);
  return {
    titulo: texto(formulario.titulo),
    descricao: texto(formulario.descricao),
    ordemFotos: formulario.fotos.map((foto) => foto.id),
    categoriaId: formulario.categoriaId,
    tags: formulario.tags,
    condicao: formulario.condicao,
    formasEntrega: formulario.formasEntrega,
    validade: formulario.validade || null,
    naoPerecivel: formulario.naoPerecivel,
    localizacao: bairro || cidade ? { bairro, cidade } : null,
  };
}

/** Nome do campo da API (`localizacao.bairro`) para o nome do campo da tela (`bairro`). */
export function campoDaApi(campo: string): CampoFormulario | null {
  const nome = campo.replace(/^localizacao\./, '');
  return nome in formularioVazio ? (nome as CampoFormulario) : null;
}
