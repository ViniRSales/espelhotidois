import clsx from 'clsx';
import { NavLink } from 'react-router';

import { NAVEGACAO } from './navegacao';

function NavegacaoInferior() {
    return (
        <nav
            aria-label='Principal'
            className='fixed inset-x-0 bottom-0 z-30 border-t border-border/15 bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden'
        >
            <ul className='mx-auto flex max-w-md justify-around'>
                {NAVEGACAO.map(({ rotulo, para, icone: Icone }) => (
                    <li key={para} className='flex-1'>
                        <NavLink
                            to={para}
                            end={para === '/'}
                            className={({ isActive }) => clsx(
                                'flex flex-col items-center gap-1 border-t-2 pt-2 pb-2.5 text-caption-medium',
                                'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
                                isActive ? 'border-accent' : 'border-transparent text-foreground/80',
                            )}
                        >
                            <Icone size={24} aria-hidden />
                            {rotulo}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default NavegacaoInferior;
