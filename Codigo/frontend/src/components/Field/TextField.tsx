import { useId, type InputHTMLAttributes } from 'react';

import Field from './Field';
import { fieldDescriptionIds, inputClasses } from './fieldIds';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
    label: string;
    optional?: boolean;
    hint?: string;
    error?: string;
    /** Mostra o contador `atual/maxLength`. */
    showCounter?: boolean;
}

/** Campo de uma linha (texto, data etc.) com rótulo, dica, contador e erro. */
function TextField({ label, optional, hint, error, showCounter, maxLength, value, className, ...props }: TextFieldProps) {
    const id = useId();
    const { describedBy } = fieldDescriptionIds(id, { hint, error });
    const counter = showCounter && maxLength ? `${String(value ?? '').length}/${maxLength}` : undefined;

    return (
        <Field id={id} label={label} optional={optional} hint={hint} counter={counter} error={error}>
            <input
                {...props}
                id={id}
                value={value}
                maxLength={maxLength}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className={inputClasses(error, className)}
            />
        </Field>
    );
}

export default TextField;
