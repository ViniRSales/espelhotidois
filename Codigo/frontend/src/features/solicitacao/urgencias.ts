import { CalendarDays, Clock, Zap, type LucideIcon } from 'lucide-react';

import { URGENCIAS as OPCOES, type Urgencia } from '@/types/solicitacao';

const ICONES: Record<Urgencia, LucideIcon> = { BAIXA: CalendarDays, MEDIA: Clock, ALTA: Zap };

type TextosUrgencia = (typeof OPCOES)[number] & { icone: LucideIcon };

/** Opções de urgência com o ícone de cada uma. */
export const URGENCIAS: TextosUrgencia[] = OPCOES.map((opcao) => ({ ...opcao, icone: ICONES[opcao.valor] }));

export function textosDaUrgencia(valor: Urgencia): TextosUrgencia {
  return URGENCIAS.find((urgencia) => urgencia.valor === valor) ?? URGENCIAS[0];
}
