import { SOLICITACAO } from '@/config/solicitacao';
import type { CampoInvalido } from '@/services/api';
import type { Solicitacao, SolicitacaoRequisicao, Urgencia } from '@/types/solicitacao';

const { tituloMinimo, tituloMaximo, descricaoMaximo, localMaximo, fotos } = SOLICITACAO;

/**
 * Foto de referência no formulário: uma já salva no pedido (com `id`) ou uma escolhida agora (com `arquivo`),
 * que só é enviada depois que o pedido é salvo. `url` serve para a prévia.
 */
export type FotoFormulario = { id?: string; arquivo?: File; url: string };

/** Estado do formulário de pedido, como vem dos inputs. */
export type Formulario = {
  titulo: string;
  descricao: string;
  foto: FotoFormulario | null;
  categoriaId: string;
  urgencia: Urgencia | null;
  bairro: string;
  cidade: string;
};

export type CampoFormulario = keyof Formulario;

export type Erros = Partial<Record<CampoFormulario, string>>;

export type AlterarCampo = <C extends CampoFormulario>(campo: C, valor: Formulario[C]) => void;

export const FORMULARIO_VAZIO: Formulario = {
  titulo: '',
  descricao: '',
  foto: null,
  categoriaId: '',
  urgencia: null,
  bairro: '',
  cidade: '',
};

/** Campos conferidos em cada etapa do assistente; a última só revisa. */
const CAMPOS_POR_ETAPA: CampoFormulario[][] = [['titulo', 'descricao', 'foto'], ['categoriaId', 'urgencia', 'bairro', 'cidade'], []];

/** Nome do campo na API (formato dos erros padronizados) para o campo do formulário. */
const CAMPOS_DA_API: Record<string, CampoFormulario> = {
  titulo: 'titulo',
  descricao: 'descricao',
  arquivo: 'foto',
  fotos: 'foto',
  categoriaId: 'categoriaId',
  urgencia: 'urgencia',
  'localizacao.bairro': 'bairro',
  'localizacao.cidade': 'cidade',
};

export function formularioDe(solicitacao: Solicitacao): Formulario {
  return {
    titulo: solicitacao.titulo,
    descricao: solicitacao.descricao ?? '',
    foto: solicitacao.fotos[0] ? { id: solicitacao.fotos[0].id, url: solicitacao.fotos[0].url } : null,
    categoriaId: solicitacao.categoria?.id ?? '',
    urgencia: solicitacao.urgencia,
    bairro: solicitacao.localizacao?.bairro ?? '',
    cidade: solicitacao.localizacao?.cidade ?? '',
  };
}

/** Mesmas regras do back-end: só título, categoria e urgência são obrigatórios. */
export function validar(formulario: Formulario): Erros {
  const erros: Erros = {};
  const titulo = formulario.titulo.trim();

  if (titulo.length < tituloMinimo) erros.titulo = `Conte do que você precisa com pelo menos ${tituloMinimo} letras.`;
  else if (titulo.length > tituloMaximo) erros.titulo = `O título pode ter até ${tituloMaximo} caracteres.`;

  if (formulario.descricao.trim().length > descricaoMaximo) {
    erros.descricao = `A descrição pode ter até ${descricaoMaximo} caracteres.`;
  }

  // O back-end confere de novo o tipo pelo conteúdo do arquivo; aqui é para avisar antes de enviar.
  const arquivo = formulario.foto?.arquivo;
  if (arquivo && !(fotos.tiposPermitidos as readonly string[]).includes(arquivo.type)) {
    erros.foto = 'Envie uma foto em JPG, PNG ou WEBP.';
  } else if (arquivo && arquivo.size > fotos.tamanhoMaximoMb * 1024 * 1024) {
    erros.foto = `Esta foto passa de ${fotos.tamanhoMaximoMb} MB. Escolha uma foto menor.`;
  }

  if (!formulario.categoriaId) erros.categoriaId = 'Escolha uma categoria da lista.';
  if (!formulario.urgencia) erros.urgencia = 'Escolha para quando você precisa.';
  if (formulario.bairro.trim().length > localMaximo) erros.bairro = `O bairro pode ter até ${localMaximo} caracteres.`;
  if (formulario.cidade.trim().length > localMaximo) erros.cidade = `A cidade pode ter até ${localMaximo} caracteres.`;

  return erros;
}

export function temErros(erros: Erros) {
  return Object.values(erros).some(Boolean);
}

export function errosDaEtapa(erros: Erros, etapa: number): Erros {
  const campos = CAMPOS_POR_ETAPA[etapa] ?? [];
  return Object.fromEntries(campos.filter((campo) => erros[campo]).map((campo) => [campo, erros[campo]])) as Erros;
}

/** Primeira etapa com algum erro, para levar a pessoa direto até ele. */
export function etapaDoPrimeiroErro(erros: Erros, padrao: number) {
  const etapa = CAMPOS_POR_ETAPA.findIndex((campos) => campos.some((campo) => erros[campo]));
  return etapa < 0 ? padrao : etapa;
}

/** Erros de validação devolvidos pela API, nos campos do formulário. */
export function errosDaApi(campos: CampoInvalido[]): Erros {
  const erros: Erros = {};
  for (const { campo, mensagem } of campos) {
    const doFormulario = CAMPOS_DA_API[campo];
    if (doFormulario && !erros[doFormulario]) erros[doFormulario] = mensagem;
  }
  return erros;
}

export function paraRequisicao(formulario: Formulario): SolicitacaoRequisicao {
  const bairro = formulario.bairro.trim();
  const cidade = formulario.cidade.trim();
  return {
    titulo: formulario.titulo.trim(),
    descricao: formulario.descricao.trim() || null,
    categoriaId: formulario.categoriaId || null,
    urgencia: formulario.urgencia,
    localizacao: bairro || cidade ? { bairro, cidade } : null,
  };
}
