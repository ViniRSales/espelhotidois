import { CircleAlert, HandHeart, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router';

import { buttonClasses } from '@/components/Button/buttonStyles';
import InfoBanner from '@/components/InfoBanner';
import AvisoPagina from '@/features/solicitacao/AvisoPagina';
import SolicitacaoCard from '@/features/solicitacao/SolicitacaoCard';
import { useSolicitacao } from '@/hooks/useSolicitacao';

/** Confirmação depois de publicar (`/adicionar/pedido/:id/publicado`), no mesmo formato do ItemPublicado. */
function PedidoPublicado() {
    const { id } = useParams();
    const { state } = useLocation();
    const { solicitacao, carregando, erro } = useSolicitacao(id);
    const aviso = (state as { aviso?: string } | null)?.aviso;

    if (carregando) {
        return (
            <p role='status' className='flex items-center justify-center gap-2 py-16 text-body-l text-muted'>
                <LoaderCircle size={20} className='animate-spin' aria-hidden />
                Carregando…
            </p>
        );
    }
    if (erro || !solicitacao) {
        return <AvisoPagina titulo='Algo deu errado' mensagem={erro ?? undefined} voltarPara='/adicionar' textoVoltar='Voltar para Adicionar' />;
    }

    return (
        <div className='mx-auto grid max-w-5xl items-start gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_22rem]'>
            <section className='flex flex-col gap-6'>
                <span className='flex size-20 items-center justify-center rounded-full bg-accent/15 text-accent' aria-hidden>
                    <HandHeart size={40} />
                </span>
                <div className='flex flex-col gap-3'>
                    <h1 className='text-title-1 leading-tight'>Pedido publicado!</h1>
                    <p className='text-body-l leading-snug'>
                        Pessoas próximas já podem ver do que você precisa. Quando alguém oferecer ajuda, vocês conversam
                        pelo Doapp, sem expor seus contatos.
                    </p>
                </div>

                {aviso && (
                    <InfoBanner title='A foto não foi enviada' icon={<CircleAlert size={18} />}>
                        {aviso}
                    </InfoBanner>
                )}

                <div className='flex flex-col gap-3 sm:flex-row'>
                    <Link to={`/pedidos/${solicitacao.id}`} className={buttonClasses('outline')}>Ver meu pedido</Link>
                    <Link to='/adicionar/pedido' className={buttonClasses('primary')}>Cadastrar outro pedido</Link>
                </div>

                <InfoBanner title='Você pode mudar de ideia' icon={<ShieldCheck size={18} />}>
                    Enquanto o pedido estiver aberto, você pode editá-lo ou cancelá-lo na página do pedido.
                </InfoBanner>
            </section>

            <aside aria-labelledby='previa-publicada' className='flex flex-col gap-3 rounded-2xl border border-border/15 bg-surface p-5'>
                <h2 id='previa-publicada' className='text-subtitle'>Pré-visualização</h2>
                <p className='text-caption text-muted'>Assim seu pedido aparece para outras pessoas.</p>
                <SolicitacaoCard
                    titulo={solicitacao.titulo}
                    descricao={solicitacao.descricao}
                    nomeCategoria={solicitacao.categoria?.nome}
                    urgencia={solicitacao.urgencia}
                    localizacao={solicitacao.localizacao}
                    fotoUrl={solicitacao.fotos[0]?.url}
                />
            </aside>
        </div>
    );
}

export default PedidoPublicado;
