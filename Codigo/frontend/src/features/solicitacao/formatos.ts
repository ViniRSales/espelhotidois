import type { Localizacao } from '@/types/doacao';

/** "Ipiranga, Belo Horizonte", ou só a parte preenchida; vazio quando não há localização. */
export function textoLocalizacao(localizacao: Localizacao | null) {
  if (!localizacao) return '';
  return [localizacao.bairro, localizacao.cidade]
    .map((parte) => parte?.trim())
    .filter(Boolean)
    .join(', ');
}

const relativo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
];

/** Tempo desde a data, em português: "há 2 dias", "ontem", "agora mesmo". */
export function tempoDesde(dataIso: string, agora = Date.now()) {
  const segundos = (new Date(dataIso).getTime() - agora) / 1000;
  for (const [unidade, tamanho] of UNIDADES) {
    if (Math.abs(segundos) >= tamanho) return relativo.format(Math.round(segundos / tamanho), unidade);
  }
  return 'agora mesmo';
}
