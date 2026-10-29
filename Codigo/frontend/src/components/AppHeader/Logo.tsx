import clsx from 'clsx';
import { Link } from 'react-router';

import logo from '@/assets/images/Doapp logo.svg';

/**
 * Logo do Doapp, que leva ao início. O SVG é claro (para fundos escuros); aqui ele vira uma máscara pintada com a
 * cor do texto, para aparecer escuro no cabeçalho claro e acompanhar o tema.
 */
function Logo({ className }: { className?: string }) {
    return (
        <Link
            to='/'
            aria-label='Doapp, ir para o início'
            className={clsx(
                'block shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
                className,
            )}
        >
            <span
                aria-hidden
                className='block aspect-[1259/445] h-10 bg-foreground'
                style={{ maskImage: `url("${logo}")`, maskSize: 'contain', maskRepeat: 'no-repeat' }}
            />
        </Link>
    );
}

export default Logo;
