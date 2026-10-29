import { useId, type TextareaHTMLAttributes } from 'react';

import Field from './Field';
import { fieldDescriptionIds, inputClasses } from './fieldIds';

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
    label: string;
    optional?: boolean;
    hint?: string;
    error?: string;
    showCounter?: boolean;
}

/** Área de texto com rótulo, dica, contador e erro. */
function TextArea({ label, optional, hint, error, showCounter, maxLength, value, rows = 4, className, ...props }: TextAreaProps) {
    const id = useId();
    const { describedBy } = fieldDescriptionIds(id, { hint, error });
    const counter = showCounter && maxLength ? `${String(value ?? '').length}/${maxLength}` : undefined;

    return (
        <Field id={id} label={label} optional={optional} hint={hint} counter={counter} error={error}>
            <textarea
                {...props}
                id={id}
                rows={rows}
                value={value}
                maxLength={maxLength}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className={inputClasses(error, `resize-y leading-snug ${className ?? ''}`)}
            />
        </Field>
    );
}

export default TextArea;
