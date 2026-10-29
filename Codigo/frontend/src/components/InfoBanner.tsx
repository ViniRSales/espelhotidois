import clsx from 'clsx';
import { Bell } from 'lucide-react';
import type { ReactNode } from 'react';

interface InfoBannerProps {
    title?: string;
    /** Ícone à esquerda; o padrão é o sino. */
    icon?: ReactNode;
    tone?: 'neutral' | 'highlight';
    className?: string;
    children: ReactNode;
}

/** Aviso curto com ícone: disponibilidade, privacidade, revisão, dicas de segurança. */
function InfoBanner({ title, icon, tone = 'highlight', className, children }: InfoBannerProps) {
    return (
        <div
            className={clsx(
                'flex items-start gap-3 rounded-xl p-4',
                tone === 'highlight' ? 'bg-highlight/20' : 'bg-border/5',
                className,
            )}
        >
            <span className='mt-0.5 shrink-0 text-foreground' aria-hidden>
                {icon ?? <Bell size={18} />}
            </span>
            <div className='flex flex-col gap-1 text-body leading-snug'>
                {title && <p className='text-subtitle-s'>{title}</p>}
                <div>{children}</div>
            </div>
        </div>
    );
}

export default InfoBanner;
