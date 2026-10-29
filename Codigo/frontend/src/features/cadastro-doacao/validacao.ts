import { DOACAO } from '@/config/doacao';

import type { CampoFormulario, Erros, FormularioDoacao } from './formulario';

export const ETAPAS = ['Nome e mídia', 'Categorias', 'Detalhes', 'Localização', 'Revisar e publicar'] as const;

export const TOTAL_ETAPAS = ETAPAS.length;

/** Em que etapa cada campo é preenchido; usado para levar a pessoa ao erro. */
const ETAPA_DO_CAMPO: Record<CampoFormulario, number> = {
  titulo: 1,
  descricao: 1,
  fotos: 1,
  categoriaId: 2,
  tags: 2,
  validade: 2,
  naoPerecivel: 2,
  condicao: 3,
  formasEntrega: 3,
  bairro: 4,
  cidade: 4,
};

export function etapaDoCampo(campo: CampoFormulario) {
  return ETAPA_DO_CAMPO[campo];
}

type Contexto = {
  /** A categoria escolhida é Alimentos. */
  ehAlimento: boolean;
  /** Data de hoje no formato `aaaa-mm-dd`. */
  hoje: string;
};

/** Mesmas regras da API (RegrasDoacao.validarPublicacao), separadas por etapa. */
export function validarEtapa(etapa: number, f: FormularioDoacao, { ehAlimento, hoje }: Contexto): Erros {
  const erros: Erros = {};
  const tamanho = (valor: string) => valor.trim().length;

  if (etapa === 1) {
    if (tamanho(f.titulo) < DOACAO.tituloMinimo) {
      erros.titulo = `Dê um nome ao item com pelo menos ${DOACAO.tituloMinimo} letras.`;
    } else if (tamanho(f.titulo) > DOACAO.tituloMaximo) {
      erros.titulo = `O nome pode ter até ${DOACAO.tituloMaximo} caracteres.`;
    }
    if (tamanho(f.descricao) === 0) {
      erros.descricao = 'Conte um pouco sobre o item.';
    } else if (tamanho(f.descricao) > DOACAO.descricaoMaximo) {
      erros.descricao = `A descrição pode ter até ${DOACAO.descricaoMaximo} caracteres.`;
    }
    if (f.fotos.length < DOACAO.fotos.minimo) {
      erros.fotos = 'Adicione pelo menos uma foto do item.';
    } else if (f.fotos.length > DOACAO.fotos.maximo) {
      erros.fotos = `Use no máximo ${DOACAO.fotos.maximo} fotos.`;
    }
  }

  if (etapa === 2) {
    if (!f.categoriaId) {
      erros.categoriaId = 'Escolha uma categoria.';
    }
    if (f.tags.length > DOACAO.tagsMaximo) {
      erros.tags = `Use no máximo ${DOACAO.tagsMaximo} tags.`;
    }
    if (ehAlimento && !f.naoPerecivel) {
      if (!f.validade) {
        erros.validade = 'Informe a validade ou marque como não perecível.';
      } else if (f.validade < hoje) {
        erros.validade = 'A validade precisa ser hoje ou uma data futura.';
      }
    }
  }

  if (etapa === 3) {
    if (!f.condicao) {
      erros.condicao = 'Conte em que estado o item está.';
    }
    if (f.formasEntrega.length === 0) {
      erros.formasEntrega = 'Escolha pelo menos uma forma de entrega.';
    }
  }

  if (etapa === 4) {
    if (tamanho(f.bairro) < DOACAO.localMinimo || tamanho(f.bairro) > DOACAO.localMaximo) {
      erros.bairro = 'Informe o bairro.';
    }
    if (tamanho(f.cidade) < DOACAO.localMinimo || tamanho(f.cidade) > DOACAO.localMaximo) {
      erros.cidade = 'Informe a cidade.';
    }
  }

  return erros;
}

/** Primeira etapa (1 a 4) com erro, ou `null` se tudo estiver certo para publicar. */
export function primeiraEtapaComErro(f: FormularioDoacao, contexto: Contexto) {
  for (let etapa = 1; etapa < TOTAL_ETAPAS; etapa++) {
    const erros = validarEtapa(etapa, f, contexto);
    if (Object.keys(erros).length > 0) return { etapa, erros };
  }
  return null;
}

/** Data de hoje no fuso do navegador, no formato `aaaa-mm-dd`. */
export function hojeLocal(agora = new Date()) {
  const doisDigitos = (n: number) => String(n).padStart(2, '0');
  return `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`;
}
