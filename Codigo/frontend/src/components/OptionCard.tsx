import clsx from 'clsx';
import { Check } from 'lucide-react';

interface OptionCardProps {
    type: 'radio' | 'checkbox';
    name: string;
    value: string;
    title: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

/** Opção em forma de cartão, com título e descrição (condição do item, formas de entrega). */
function OptionCard({ type, name, value, title, description, checked, onChange }: OptionCardProps) {
    return (
        <label
            className={clsx(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent',
                checked ? 'border-accent bg-accent/10' : 'border-border/25 bg-surface hover:border-border/60',
            )}
        >
            <input
                type={type}
                name={name}
                value={value}
                checked={checked}
                onChange={(evento) => onChange(evento.target.checked)}
                className='sr-only'
            />
            <span
                aria-hidden
                className={clsx(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center border-2 transition',
                    type === 'radio' ? 'rounded-full' : 'rounded',
                    checked ? 'border-accent bg-accent text-surface' : 'border-border/50 bg-surface',
                )}
            >
                {checked && (type === 'radio' ? <span className='size-2 rounded-full bg-surface' /> : <Check size={14} strokeWidth={3} />)}
            </span>
            <span className='flex flex-col gap-1.5'>
                <span className='text-subtitle'>{title}</span>
                {description && <span className='text-caption leading-snug text-muted'>{description}</span>}
            </span>
        </label>
    );
}

export default OptionCard;
