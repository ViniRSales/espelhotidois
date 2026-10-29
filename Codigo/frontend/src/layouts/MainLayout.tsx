import clsx from 'clsx';
import { Outlet } from 'react-router';

import AppHeader from '@/components/AppHeader/AppHeader';
import NavegacaoInferior from '@/components/AppHeader/NavegacaoInferior';
import { useAutenticacao } from '@/features/autenticacao/useAutenticacao';

function MainLayout() {
    const logado = useAutenticacao().situacao === 'logado';

    return (
        <>
            <a
                href='#conteudo'
                className='sr-only z-50 rounded-md bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2'
            >
                Pular para o conteúdo
            </a>
            <AppHeader />
            {/* No celular e no tablet, quem entrou tem a barra de navegação embaixo; o espaço extra evita cobrir o conteúdo. */}
            <main id='conteudo' className={clsx('container-pagina py-5', logado && 'max-lg:pb-24')}>
                <Outlet />
            </main>
            {logado && <NavegacaoInferior />}
        </>
    );
}

export default MainLayout;
