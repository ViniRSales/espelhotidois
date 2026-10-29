import { Link } from 'react-router';

import { buttonClasses } from '@/components/Button/buttonStyles';

interface PerguntaComLinkProps {
    pergunta: string;
    para: string;
    /** Repassa o state da rota, para manter a tela protegida que a pessoa tentou abrir. */
    state?: unknown;
    children: string;
}

/** Rodapé das telas de autenticação, como "Já tem conta? Entrar". */
function PerguntaComLink({ pergunta, para, state, children }: PerguntaComLinkProps) {
    return (
        <p className='flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-body'>
            {pergunta}
            <Link to={para} state={state} className={buttonClasses('link')}>{children}</Link>
        </p>
    );
}

export default PerguntaComLink;
