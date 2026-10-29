import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { buttonClasses, type ButtonVariant } from './buttonStyles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    icon?: ReactNode;
    /** Mostra um indicador de carregamento e desativa o botão. */
    loading?: boolean;
}

function Button({ variant = 'primary', icon, loading = false, disabled, className, children, type = 'button', ...props }: ButtonProps) {
    return (
        <button
            {...props}
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={buttonClasses(variant, className)}
        >
            {loading ? <LoaderCircle size={18} className='animate-spin' aria-hidden /> : icon}
            {children}
        </button>
    );
}

export default Button;
