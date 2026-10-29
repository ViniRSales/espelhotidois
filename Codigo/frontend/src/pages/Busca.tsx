import { SearchX } from 'lucide-react';
import { useSearchParams } from 'react-router';

function Busca() {
    const [parametros] = useSearchParams();
    const termo = parametros.get('q')?.trim() ?? '';

    return (
        <section aria-labelledby='titulo-busca' className='mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center'>
            <SearchX size={40} className='text-accent' aria-hidden />
            <h1 id='titulo-busca' className='text-title-3 leading-tight break-words'>
                {termo ? <>Resultados para “{termo}”</> : 'Pesquisar'}
            </h1>
            <p className='text-body-l leading-snug text-muted'>
                A busca de doações e pedidos ainda está em construção. Em breve os resultados aparecem aqui.
            </p>
        </section>
    );
}

export default Busca;
