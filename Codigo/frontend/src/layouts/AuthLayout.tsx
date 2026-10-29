import { Outlet } from 'react-router';

import Logo from '@/components/AppHeader/Logo';

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
