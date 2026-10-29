import clsx from 'clsx';
import { useId } from 'react';

interface ToggleProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

/** Interruptor liga/desliga (`role="switch"`). */
function Toggle({ label, description, checked, onChange }: ToggleProps) {
    const id = useId();

    return (
        <div className='flex items-center justify-between gap-4'>
            <span className='flex flex-col gap-1'>
                <span id={`${id}-rotulo`} className='text-subtitle'>{label}</span>
                {description && <span id={`${id}-descricao`} className='text-caption leading-snug text-muted'>{description}</span>}
            </span>
            <button
                type='button'
                role='switch'
                aria-checked={checked}
                aria-labelledby={`${id}-rotulo`}
                aria-describedby={description ? `${id}-descricao` : undefined}
                onClick={() => onChange(!checked)}
                className={clsx(
                    'relative h-7 w-12 shrink-0 rounded-full transition',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    checked ? 'bg-accent' : 'bg-border/30',
                )}
            >
                <span
                    aria-hidden
                    className={clsx(
                        'absolute top-1 left-1 size-5 rounded-full bg-surface shadow transition-transform',
                        checked && 'translate-x-5',
                    )}
                />
            </button>
        </div>
    );
}

export default Toggle;
