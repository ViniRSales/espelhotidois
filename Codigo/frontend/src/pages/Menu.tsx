import { ChevronRight, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import PageHeader from '@/components/PageHeader';
import { useAutenticacao } from '@/features/autenticacao/useAutenticacao';

/**
 * Menu da conta (wireframe "Desktop / Menu"). Por enquanto só tem "Sair"; preferências e edição da conta
 * entram com as próximas issues.
 */
function Menu() {
    const { sair } = useAutenticacao();
    const navigate = useNavigate();
    const [saindo, setSaindo] = useState(false);

    async function encerrarSessao() {
        setSaindo(true);
        await sair();
        navigate('/', { replace: true });
    }

    return (
        <div className='flex flex-col gap-8'>
            <PageHeader title='Menu' subtitle='Gerencie sua conta, suas preferências e encontre ajuda.' />
            <section aria-labelledby='titulo-conta' className='flex flex-col gap-3'>
                <h2 id='titulo-conta' className='text-subtitle'>Sua conta</h2>
                <button
                    type='button'
                    onClick={encerrarSessao}
                    disabled={saindo}
                    className='flex items-center gap-3 rounded-xl border border-border/15 bg-surface px-4 py-4 text-left text-subtitle-s hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60'
                >
                    <LogOut size={20} aria-hidden />
                    <span className='flex-1'>{saindo ? 'Saindo…' : 'Sair'}</span>
                    <ChevronRight size={20} aria-hidden />
                </button>
            </section>
        </div>
    );
}

export default Menu;
