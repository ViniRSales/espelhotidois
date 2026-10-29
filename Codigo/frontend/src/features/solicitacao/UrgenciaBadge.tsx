import clsx from 'clsx';

import type { Urgencia } from '@/types/solicitacao';
import { textosDaUrgencia } from './urgencias';

interface UrgenciaBadgeProps {
    urgencia: Urgencia;
    grande?: boolean;
}

/** Selo com ícone e texto, para a urgência não depender só da cor. Urgente usa o destaque do tema. */
function UrgenciaBadge({ urgencia, grande = false }: UrgenciaBadgeProps) {
    const { rotulo, icone: Icone } = textosDaUrgencia(urgencia);

    return (
        <span
            className={clsx(
                'inline-flex items-center gap-1.5 rounded-full text-foreground',
                grande ? 'px-3.5 py-2 text-label font-bold' : 'px-2.5 py-1.5 text-caption-bold',
                urgencia === 'ALTA' ? 'bg-highlight' : 'border border-border/20 bg-surface',
            )}
        >
            <Icone className={grande ? 'size-4' : 'size-3.5'} strokeWidth={2.5} aria-hidden />
            {rotulo}
        </span>
    );
}

export default UrgenciaBadge;
