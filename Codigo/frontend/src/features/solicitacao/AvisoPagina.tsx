import { Link } from 'react-router';

import { buttonClasses } from '@/components/Button/buttonStyles';

interface AvisoPaginaProps {
    titulo: string;
    mensagem?: string;
    voltarPara?: string;
    textoVoltar?: string;
}

/** Página no lugar do conteúdo quando o pedido não carrega ou não pode ser aberto (mesmo estilo do ItemPublicado). */
function AvisoPagina({ titulo, mensagem, voltarPara = '/', textoVoltar = 'Voltar para o início' }: AvisoPaginaProps) {
    return (
        <section role='alert' className='mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center'>
            <h1 className='text-title-3 leading-tight'>{titulo}</h1>
            {mensagem && <p className='text-body-l leading-snug text-muted'>{mensagem}</p>}
            <Link to={voltarPara} className={buttonClasses('primary')}>{textoVoltar}</Link>
        </section>
    );
}

export default AvisoPagina;
