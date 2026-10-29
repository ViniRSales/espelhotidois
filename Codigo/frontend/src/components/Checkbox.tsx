import { useId, type InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
    label: string;
    description?: string;
}

/** Caixa de seleção nativa (funciona com teclado e leitor de tela) com rótulo e descrição. */
function Checkbox({ label, description, className, ...props }: CheckboxProps) {
    const id = useId();

    return (
        <div className='flex items-start gap-3'>
            <input
                {...props}
                type='checkbox'
                id={id}
                aria-describedby={description ? `${id}-descricao` : undefined}
                className={
                    'mt-px size-5 shrink-0 cursor-pointer accent-accent ' +
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
                    (className ?? '')
                }
            />
            <div className='flex flex-col gap-1.5'>
                <label htmlFor={id} className='cursor-pointer text-body-l leading-snug'>{label}</label>
                {description && <p id={`${id}-descricao`} className='text-caption leading-snug text-muted'>{description}</p>}
            </div>
        </div>
    );
}

export default Checkbox;
