import type { ReactNode } from 'react';

import { fieldDescriptionIds } from './fieldIds';

interface FieldProps {
    /** Id do controle; liga o rótulo, a dica e o erro a ele. */
    id: string;
    label: string;
    optional?: boolean;
    hint?: string;
    /** Texto do contador, por exemplo `17/90`. */
    counter?: string;
    action?: ReactNode;
    error?: string;
    children: ReactNode;
}

/** Moldura comum dos campos de formulário: rótulo, dica, contador e mensagem de erro. */
function Field({ id, label, optional, hint, counter, action, error, children }: FieldProps) {
    const ids = fieldDescriptionIds(id, { hint, error });

    return (
        <div className='flex flex-col gap-2'>
            <div className='flex items-baseline justify-between gap-3'>
                <label htmlFor={id} className='text-subtitle'>
                    {label}
                    {optional && <span className='text-body text-muted'> (opcional)</span>}
                </label>
                {counter && <span className='text-caption text-muted tabular-nums'>{counter}</span>}
                {action}
            </div>
            {hint && <p id={ids.hint} className='text-caption leading-snug text-muted'>{hint}</p>}
            {children}
            {error && <p id={ids.error} className='text-caption-medium leading-snug text-danger'>{error}</p>}
        </div>
    );
}

export default Field;
