import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import NavButton from './NavButton';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    backTo?: string;
    actions?: ReactNode;
}

function PageHeader({ title, subtitle, backTo, actions }: PageHeaderProps) {
    return (
        <header className='flex flex-row gap-4 md:gap-10 items-center w-full'>
            {
                backTo &&
                <NavButton
                    className='shrink-0'
                    aria-label='Voltar'
                    icon={<ArrowLeft size={28} className='text-foreground font-semibold' aria-hidden />}
                    to={backTo}
                />
            }
            <div className='flex min-w-0 flex-1 flex-col gap-2'>
                <h1 className='text-title-3 leading-tight md:text-title-1'>{title}</h1>
                {subtitle &&
                    <p className='text-body leading-snug text-muted'>
                        {subtitle}
                    </p>}
            </div>
            {actions &&
                <div className='flex flex-row gap-3 shrink-0'>
                    {actions}
                </div>
            }
        </header>
    );
};

export default PageHeader;