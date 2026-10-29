import { Outlet } from 'react-router';

import Logo from '@/components/AppHeader/Logo';

/** Layout das telas de autenticação: logo centralizado no topo e uma coluna só, sem busca nem navegação. */
function AuthLayout() {
    return (
        <div className='flex min-h-dvh flex-col items-center bg-background px-4 pt-10 pb-16 text-foreground md:pt-14'>
            <header className='mb-6'>
                <Logo />
            </header>
            <main className='flex w-full justify-center'>
                <Outlet />
            </main>
        </div>
    );
}

export default AuthLayout;
