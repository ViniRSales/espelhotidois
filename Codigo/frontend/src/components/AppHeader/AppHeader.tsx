import clsx from 'clsx';
import { Bell, MapPin } from 'lucide-react';
import { NavLink } from 'react-router';

import { useAutenticacao } from '@/features/autenticacao/useAutenticacao';

import Logo from './Logo';
import { NAVEGACAO } from './navegacao';
import SearchBar from './SearchBar';

const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

function Atalho({ para, rotulo, children }: { para: string; rotulo: string; children: React.ReactNode }) {
    return (
        <NavLink
            to={para}
            aria-label={rotulo}
            title={rotulo}
            className={({ isActive }) => clsx('grid size-10 place-items-center rounded-full hover:bg-background', foco, isActive && 'text-accent')}
        >
            {children}
        </NavLink>
    );
}

function AppHeader() {
    const { situacao } = useAutenticacao();
    const logado = situacao === 'logado';

    return (
        <header className='relative z-30 border-b border-border/15 bg-surface'>
            <div className='container-pagina flex h-18 items-center gap-4 md:h-20 md:gap-6 xl:gap-8'>
                <Logo />
                <SearchBar className='flex-1 lg:max-w-xl' />
                {logado && (
                    <>
                        <nav aria-label='Principal' className='ml-auto self-stretch max-lg:hidden'>
                            <ul className='flex h-full gap-1'>
                                {NAVEGACAO.map(({ rotulo, para, icone: Icone }) => (
                                    <li key={para} className='flex'>
                                        <NavLink
                                            to={para}
                                            end={para === '/'}
                                            className={({ isActive }) => clsx(
                                                'flex flex-col items-center justify-center gap-1 border-y-2 border-t-transparent px-3 text-caption-medium',
                                                'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
                                                isActive ? 'border-b-accent' : 'border-b-transparent text-foreground/80 hover:text-foreground',
                                            )}
                                        >
                                            <Icone size={24} aria-hidden />
                                            {rotulo}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                        <div className='flex items-center gap-2 max-lg:hidden'>
                            <Atalho para='/localizacao' rotulo='Sua localização'><MapPin size={26} aria-hidden /></Atalho>
                            <Atalho para='/notificacoes' rotulo='Notificações'><Bell size={26} aria-hidden /></Atalho>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}

export default AppHeader;
