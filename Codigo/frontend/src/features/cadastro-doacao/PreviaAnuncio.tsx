import ItemCard from '@/components/ItemCard';
import { rotuloCondicao, rotuloFormaEntrega } from '@/types/doacao';

import { useCadastroDoacao } from './useCadastroDoacao';

interface PreviaAnuncioProps {
    titulo?: string;
    legenda?: string;
}

/** Cartão do anúncio montado com o que já foi preenchido. */
function PreviaAnuncio({ titulo = 'Pré-visualização do anúncio', legenda }: PreviaAnuncioProps) {
    const { estado, categoriaEscolhida } = useCadastroDoacao();
    const { formulario } = estado;
    const chips = [
        categoriaEscolhida?.nome,
        rotuloCondicao(formulario.condicao),
        formulario.formasEntrega[0] && rotuloFormaEntrega(formulario.formasEntrega[0]),
        ...formulario.tags,
    ].filter((chip): chip is string => Boolean(chip)).slice(0, 3);

    return (
        <section aria-label={titulo} className='flex flex-col gap-3'>
            <h2 className='text-subtitle'>{titulo}</h2>
            {legenda && <p className='text-caption leading-snug text-muted'>{legenda}</p>}
            <ItemCard
                title={formulario.titulo.trim()}
                description={formulario.descricao.trim()}
                photoUrl={formulario.fotos[0]?.url}
                chips={chips}
                location={formulario.bairro.trim()}
            />
        </section>
    );
}

export default PreviaAnuncio;
