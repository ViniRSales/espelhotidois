import clsx from 'clsx';
import { useId, type ReactNode } from 'react';

interface FieldGroupProps {
    legend: string;
    hint?: string;
    error?: string;
    /** Classes do contêiner das opções (por exemplo, a grade). */
    className?: string;
    children: ReactNode;
}

/** Grupo de opções (radio ou checkbox) com legenda, dica e erro, usando `fieldset` para os leitores de tela. */
function FieldGroup({ legend, hint, error, className, children }: FieldGroupProps) {
    const id = useId();

    return (
        <fieldset
            className='flex min-w-0 flex-col gap-2'
            aria-describedby={clsx(hint && `${id}-dica`, error && `${id}-erro`) || undefined}
        >
            <legend className='mb-2 text-subtitle'>{legend}</legend>
            {hint && <p id={`${id}-dica`} className='text-caption leading-snug text-muted'>{hint}</p>}
            <div className={className}>{children}</div>
            {error && <p id={`${id}-erro`} className='text-caption-medium leading-snug text-danger'>{error}</p>}
        </fieldset>
    );
}

export default FieldGroup;
