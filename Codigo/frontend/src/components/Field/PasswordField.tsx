import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';

import Field from './Field';
import { fieldDescriptionIds, inputClasses } from './fieldIds';

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
    label: string;
    hint?: string;
    error?: string;
    action?: ReactNode;
}

function PasswordField({ label, hint, error, action, className, ...props }: PasswordFieldProps) {
    const id = useId();
    const [visivel, setVisivel] = useState(false);
    const { describedBy } = fieldDescriptionIds(id, { hint, error });

    return (
        <Field id={id} label={label} hint={hint} error={error} action={action}>
            <div className='relative'>
                <input
                    {...props}
                    id={id}
                    type={visivel ? 'text' : 'password'}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    className={inputClasses(error, `pr-28 sm:pr-40 ${className ?? ''}`)}
                />
                <button
                    type='button'
                    onClick={() => setVisivel((atual) => !atual)}
                    aria-controls={id}
                    className={
                        'absolute inset-y-1 right-1 flex items-center gap-1.5 rounded-lg px-3 text-link text-foreground ' +
                        'hover:bg-background focus-visible:outline-2 focus-visible:outline-accent'
                    }
                >
                    {visivel ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                    <span>
                        {visivel ? 'Ocultar' : 'Mostrar'}{' '}
                        <span className='max-sm:sr-only'>senha</span>
                    </span>
                </button>
            </div>
        </Field>
    );
}

export default PasswordField;
