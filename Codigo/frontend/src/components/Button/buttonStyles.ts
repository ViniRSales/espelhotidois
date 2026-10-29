import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'link';

const variantes: Record<ButtonVariant, string> = {
    primary: 'rounded-full bg-accent px-6 py-3 text-accent-foreground shadow-sm hover:brightness-95',
    secondary: 'rounded-full bg-surface px-6 py-3 text-foreground shadow-sm ring-1 ring-border/15 hover:bg-background',
    outline: 'rounded-full border border-border px-6 py-3 text-foreground hover:bg-surface',
    link: 'text-link underline underline-offset-4 hover:text-accent',
};

/**
 * Classes de botão, para usar também em links (`<Link className={buttonClasses('primary')}>`).
 */
export function buttonClasses(variant: ButtonVariant = 'primary', className?: string) {
    return clsx(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap text-button transition',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantes[variant],
        className,
    );
}
