import { Link } from 'react-router';

import { buttonClasses } from '@/components/Button/buttonStyles';

import PerguntaComLink from './PerguntaComLink';

/** Cartão da Home para quem não entrou: convida a criar conta ou entrar. */
function ConviteVisitante() {
    return (
        <section
            aria-labelledby='titulo-convite'
            className='flex w-full flex-col items-center justify-center gap-5 rounded-2xl border border-border/15 bg-surface p-6 text-center shadow-lg md:p-8'
        >
            <h2 id='titulo-convite' className='text-title-2 leading-tight'>Doe e receba</h2>
            <p className='text-body leading-snug text-muted'>
                Crie sua conta para doar o que não usa, pedir o que precisa e conversar com quem está no seu bairro.
            </p>
            <Link to='/criar-conta' className={buttonClasses('primary', 'w-full')}>Criar conta</Link>
            <span aria-hidden className='h-px w-full bg-border/15' />
            <PerguntaComLink pergunta='Já tem conta?' para='/entrar'>Entrar</PerguntaComLink>
        </section>
    );
}

export default ConviteVisitante;
