import clsx from 'clsx';

/** Ids da dica e do erro de um campo, e o valor de `aria-describedby` que aponta para eles. */
export function fieldDescriptionIds(id: string, { hint, error }: { hint?: string; error?: string }) {
    const ids = { hint: `${id}-dica`, error: `${id}-erro` };
    return {
        ...ids,
        describedBy: clsx(hint && ids.hint, error && ids.error) || undefined,
    };
}

/** Classes comuns de inputs e áreas de texto, com destaque quando há erro. */
export function inputClasses(error?: string, className?: string) {
    return clsx(
        'w-full rounded-xl border bg-surface px-4 py-3 text-body-l text-foreground placeholder:text-muted',
        'focus:outline-2 focus:outline-offset-1 focus:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-danger' : 'border-border/25',
        className,
    );
}
