import { HandHeart, PackageOpen, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { buttonClasses } from '@/components/Button/buttonStyles';
import InfoBanner from '@/components/InfoBanner';
import PageHeader from '@/components/PageHeader';

interface OpcaoProps {
    icone: ReactNode;
    titulo: string;
    descricao: string;
    informar: string[];
    acao: string;
    destino: string;
}

function Opcao({ icone, titulo, descricao, informar, acao, destino }: OpcaoProps) {
    return (
        <article className='flex flex-col gap-5 rounded-2xl border border-border/15 bg-surface p-6'>
            <span className='flex size-16 items-center justify-center rounded-2xl bg-accent/15 text-accent' aria-hidden>
                {icone}
            </span>
            <div className='flex flex-col gap-3'>
                <h2 className='text-section leading-snug'>{titulo}</h2>
                <p className='text-body-l leading-snug'>{descricao}</p>
            </div>
            <div className='flex flex-1 flex-col gap-2'>
                <p className='text-subtitle-s'>Você vai informar:</p>
                <ul className='flex list-disc flex-col gap-1.5 pl-5 text-body leading-snug text-muted'>
                    {informar.map((item) => <li key={item}>{item}</li>)}
                </ul>
            </div>
            <Link to={destino} className={buttonClasses('primary', 'w-full')}>{acao}</Link>
        </article>
    );
}

const PASSOS = [
    { titulo: 'Cadastre', texto: 'Publique um item ou um pedido em poucos passos.' },
    { titulo: 'Converse', texto: 'Combine os detalhes pelo bate-papo do app.' },
    { titulo: 'Combine a entrega', texto: 'Prefira um local público e seguro para a troca.' },
];

/** Escolha entre cadastrar um item para doar ou um pedido de doação. */
function Adicionar() {
    return (
        <div className='mx-auto flex max-w-6xl flex-col gap-10 py-8'>
            <PageHeader
                title='O que você quer fazer?'
                subtitle='Doe o que você não usa mais ou peça o que está precisando. Leva só alguns minutos.'
            />

            <div className='grid gap-6 md:grid-cols-2'>
                <Opcao
                    icone={<PackageOpen size={32} />}
                    titulo='Quero cadastrar um item disponível para doação'
                    descricao='Tem algo em bom estado parado em casa? Anuncie para alguém do seu bairro.'
                    informar={['Nome, descrição e fotos', 'Categoria e tags', 'Condição, entrega e prazo de 30 dias', 'Bairro (nunca o endereço exato)']}
                    acao='Cadastrar item'
                    destino='/adicionar/item'
                />
                <Opcao
                    icone={<HandHeart size={32} />}
                    titulo='Quero cadastrar um pedido para doação'
                    descricao='Precisa de algo? Conte o que é e quem pode ajudar vai te encontrar.'
                    informar={['Título e descrição', 'Categoria e para quando você precisa', 'Bairro, se quiser (nunca o endereço exato)']}
                    acao='Cadastrar pedido'
                    destino='/adicionar/pedido'
                />
            </div>

            <section aria-labelledby='como-funciona' className='flex flex-col gap-4'>
                <h2 id='como-funciona' className='text-section'>Como funciona</h2>
                <ol className='grid gap-4 md:grid-cols-3'>
                    {PASSOS.map((passo, indice) => (
                        <li key={passo.titulo} className='flex items-start gap-4 rounded-2xl border border-border/15 bg-surface p-5'>
                            <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-label text-surface' aria-hidden>
                                {indice + 1}
                            </span>
                            <span className='flex flex-col gap-1.5'>
                                <span className='text-subtitle'>{passo.titulo}</span>
                                <span className='text-body leading-snug text-muted'>{passo.texto}</span>
                            </span>
                        </li>
                    ))}
                </ol>
            </section>

            <InfoBanner title='Dicas de segurança' icon={<ShieldCheck size={18} />}>
                Combine a entrega em locais públicos e nunca compartilhe seu endereço completo no chat. Veja todas as dicas no menu.
            </InfoBanner>
        </div>
    );
}

export default Adicionar;
