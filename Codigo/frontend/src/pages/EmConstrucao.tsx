import { Construction } from 'lucide-react';
import { Link } from 'react-router';

import { buttonClasses } from '@/components/Button/buttonStyles';

/** Página provisória para rotas que outras tasks vão implementar (por exemplo, a página da doação e o bate-papo). */
function EmConstrucao() {
    return (
        <section className='mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center'>
            <Construction size={40} className='text-accent' aria-hidden />
            <h1 className='text-title-3 leading-tight'>Esta página ainda está em construção</h1>
            <p className='text-body-l leading-snug text-muted'>Em breve você vai poder ver tudo por aqui.</p>
            <Link to='/' className={buttonClasses('primary')}>Voltar para o início</Link>
        </section>
    );
}

export default EmConstrucao;
