import type { Doacao, Foto } from '@/types/doacao';

import { formularioDaDoacao, formularioVazio, type CampoFormulario, type Erros, type FormularioDoacao } from './formulario';
import { TOTAL_ETAPAS } from './validacao';

export type EstadoCadastro = {
  /** Id do rascunho na API; `null` até o primeiro salvamento. */
  id: string | null;
  formulario: FormularioDoacao;
  etapa: number;
  /** Maior etapa já alcançada; até ela o stepper deixa voltar e avançar. */
  etapaMaxima: number;
  /** Há alterações ainda não salvas no rascunho. */
  sujo: boolean;
  salvando: boolean;
  /** Quantas fotos estão sendo enviadas agora. */
  enviandoFotos: number;
  erros: Erros;
  /** Erro que não é de um campo (conexão, conflito). */
  erroGeral: string | null;
};

export type AcaoCadastro =
  | { tipo: 'carregar'; doacao: Doacao; etapa: number }
  | { tipo: 'alterar'; campos: Partial<FormularioDoacao> }
  | { tipo: 'irPara'; etapa: number }
  | { tipo: 'salvando' }
  | { tipo: 'salvo'; doacao: Doacao }
  | { tipo: 'falhou'; erros?: Erros; erroGeral?: string | null }
  | { tipo: 'enviandoFotos'; quantidade: number }
  | { tipo: 'fotoAdicionada'; foto: Foto }
  | { tipo: 'fotoRemovida'; fotoId: string };

export const estadoInicial: EstadoCadastro = {
  id: null,
  formulario: formularioVazio,
  etapa: 1,
  etapaMaxima: 1,
  sujo: false,
  salvando: false,
  enviandoFotos: 0,
  erros: {},
  erroGeral: null,
};

function limitarEtapa(etapa: number) {
  return Math.min(Math.max(etapa, 1), TOTAL_ETAPAS);
}

/** Tira os erros dos campos que a pessoa acabou de mexer. */
function semErrosDe(erros: Erros, campos: CampoFormulario[]): Erros {
  const restantes = { ...erros };
  for (const campo of campos) delete restantes[campo];
  return restantes;
}

export function cadastroReducer(estado: EstadoCadastro, acao: AcaoCadastro): EstadoCadastro {
  switch (acao.tipo) {
    case 'carregar': {
      const etapa = limitarEtapa(acao.etapa);
      return {
        ...estadoInicial,
        id: acao.doacao.id,
        formulario: formularioDaDoacao(acao.doacao),
        etapa,
        etapaMaxima: etapa,
      };
    }
    case 'alterar':
      return {
        ...estado,
        formulario: { ...estado.formulario, ...acao.campos },
        sujo: true,
        erros: semErrosDe(estado.erros, Object.keys(acao.campos) as CampoFormulario[]),
      };
    case 'irPara': {
      const etapa = limitarEtapa(acao.etapa);
      return { ...estado, etapa, etapaMaxima: Math.max(estado.etapaMaxima, etapa), erros: {}, erroGeral: null };
    }
    case 'salvando':
      return { ...estado, salvando: true, erroGeral: null };
    case 'salvo':
      // O servidor devolve as fotos na ordem enviada; os demais campos já estão no formulário.
      return {
        ...estado,
        id: acao.doacao.id,
        formulario: { ...estado.formulario, fotos: acao.doacao.fotos },
        salvando: false,
        sujo: false,
      };
    case 'falhou':
      return { ...estado, salvando: false, erros: acao.erros ?? estado.erros, erroGeral: acao.erroGeral ?? null };
    case 'enviandoFotos':
      return { ...estado, enviandoFotos: Math.max(estado.enviandoFotos + acao.quantidade, 0) };
    case 'fotoAdicionada':
      return {
        ...estado,
        formulario: { ...estado.formulario, fotos: [...estado.formulario.fotos, acao.foto] },
        erros: semErrosDe(estado.erros, ['fotos']),
      };
    case 'fotoRemovida':
      return {
        ...estado,
        formulario: { ...estado.formulario, fotos: estado.formulario.fotos.filter((foto) => foto.id !== acao.fotoId) },
      };
  }
}
