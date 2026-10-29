import { Clock, LoaderCircle, MapPin, MessageCircle, Pencil, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router';

import Button from '@/components/Button/Button';
import { buttonClasses } from '@/components/Button/buttonStyles';
import InfoBanner from '@/components/InfoBanner';
import AvisoPagina from '@/features/solicitacao/AvisoPagina';
import CancelarSolicitacao from '@/features/solicitacao/CancelarSolicitacao';
import { tempoDesde, textoLocalizacao } from '@/features/solicitacao/formatos';
import UrgenciaBadge from '@/features/solicitacao/UrgenciaBadge';
import { useSolicitacao } from '@/hooks/useSolicitacao';
import type { Solicitacao } from '@/types/solicitacao';

const SITUACAO_ENCERRADA = {
    CANCELADA: 'Este pedido foi cancelado e não aparece mais para as pessoas.',
    ATENDIDA: 'Este pedido já foi atendido.',
};

function AcoesDono({ solicitacao, atualizar }: { solicitacao: Solicitacao; atualizar: (s: Solicitacao) => void }) {
    if (solicitacao.situacao !== 'ABERTA') {
        return <p className='text-body-l leading-snug'>{SITUACAO_ENCERRADA[solicitacao.situacao]}</p>;
    }
    return (
        <>
            <Link to={`/pedidos/${solicitacao.id}/editar`} className={buttonClasses('primary', 'w-full')}>
                <Pencil size={18} aria-hidden />
                Editar pedido
            </Link>
            <CancelarSolicitacao solicitacaoId={solicitacao.id} aoCancelar={atualizar} />
        </>
    );
}

function AcoesVisitante({ solicitacao }: { solicitacao: Solicitacao }) {
    if (solicitacao.situacao !== 'ABERTA') {
        return <p className='text-body-l leading-snug'>Este pedido já foi encerrado.</p>;
    }
    // O bate-papo é a issue #16 (Sprint 2): até lá o botão fica visível, mas desativado.
    return (
        <>
            <h2 className='hidden text-subtitle lg:block'>Tem algo assim para doar?</h2>
            <Button disabled aria-describedby='aviso-bate-papo' icon={<MessageCircle size={18} aria-hidden />} className='w-full'>
                Oferecer ajuda
            </Button>
            <p id='aviso-bate-papo' className='text-center text-caption leading-snug text-muted lg:text-left'>
                Em breve você vai poder conversar com quem fez o pedido, sem expor seus contatos.
            </p>
        </>
    );
}

/** Detalhe do pedido (`/pedidos/:id`). O dono vê editar e cancelar; as ações ficam fixas no rodapé no celular. */
function DetalheSolicitacao() {
    const { id } = useParams();
    const { state } = useLocation();
    const { solicitacao, carregando, erro, atualizar } = useSolicitacao(id);
    const aviso = (state as { aviso?: string } | null)?.aviso;

    if (carregando) {
        return (
            <p role='status' className='flex items-center justify-center gap-2 py-16 text-body-l text-muted'>
                <LoaderCircle size={20} className='animate-spin' aria-hidden />
                Carregando…
            </p>
        );
    }
    if (erro || !solicitacao) return <AvisoPagina titulo='Algo deu errado' mensagem={erro ?? undefined} />;

    const local = textoLocalizacao(solicitacao.localizacao);

    return (
        <div className='mx-auto max-w-6xl pt-6 pb-44 lg:pb-16'>
            <nav aria-label='Você está em' className='mb-6 flex flex-wrap items-center gap-2 text-body text-muted'>
                <Link to='/' className='underline-offset-4 hover:underline'>Início</Link>
                <span aria-hidden>/</span>
                <span aria-current='page' className='min-w-0 truncate text-foreground'>{solicitacao.titulo}</span>
            </nav>

            {aviso && <InfoBanner className='mb-6' tone='highlight'>{aviso}</InfoBanner>}

            <div className='grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]'>
                <article className='flex min-w-0 flex-col gap-6'>
                    {solicitacao.souDono && solicitacao.situacao === 'ABERTA' && (
                        <InfoBanner tone='neutral' icon={<ShieldCheck size={18} />}>
                            <strong>Este é o seu pedido.</strong> Só você vê os botões de editar e cancelar.
                        </InfoBanner>
                    )}

                    <header className='flex flex-col gap-3'>
                        <div className='flex flex-wrap gap-2'>
                            <UrgenciaBadge urgencia={solicitacao.urgencia} grande />
                            {solicitacao.categoria && (
                                <span className='rounded-md bg-surface px-3 py-2 text-label ring-1 ring-border/15'>
                                    {solicitacao.categoria.nome}
                                </span>
                            )}
                        </div>
                        <h1 className='text-title-2 leading-tight break-words md:text-title-1'>{solicitacao.titulo}</h1>
                        <div className='flex flex-wrap gap-x-5 gap-y-2 text-body text-muted'>
                            {local && (
                                <span className='inline-flex items-center gap-1.5'>
                                    <MapPin size={16} aria-hidden />
                                    {local}
                                </span>
                            )}
                            <span className='inline-flex items-center gap-1.5'>
                                <Clock size={16} aria-hidden />
                                Publicado {tempoDesde(solicitacao.dataCadastro)}
                            </span>
                        </div>
                    </header>

                    {solicitacao.fotos[0] && (
                        <figure className='overflow-hidden rounded-2xl border border-border/15 bg-border/5'>
                            <img
                                src={solicitacao.fotos[0].url}
                                alt={`Foto de referência: ${solicitacao.titulo}`}
                                className='max-h-96 w-full object-contain'
                            />
                        </figure>
                    )}

                    {solicitacao.descricao && (
                        <section className='flex flex-col gap-3 rounded-2xl border border-border/15 bg-surface p-5 md:p-7'>
                            <h2 className='text-section'>Sobre o pedido</h2>
                            <p className='text-body-l leading-relaxed break-words whitespace-pre-line'>{solicitacao.descricao}</p>
                        </section>
                    )}

                    {local && (
                        <section className='flex flex-col gap-2 rounded-2xl border border-border/15 bg-surface p-5 md:p-7'>
                            <h2 className='text-section'>Localização</h2>
                            <p className='text-body-l leading-snug text-muted'>
                                {local}. A localização exata não é exibida: vocês combinam o local da entrega pela conversa.
                            </p>
                        </section>
                    )}
                </article>

                <aside className='flex flex-col gap-4 lg:sticky lg:top-6'>
                    {/* No celular, as ações ficam fixas no rodapé da tela (F16). */}
                    <section
                        aria-label='Ações do pedido'
                        className='fixed inset-x-0 bottom-0 z-10 flex flex-col gap-2 border-t border-border/15 bg-surface px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:static lg:gap-4 lg:rounded-2xl lg:border lg:p-6'
                    >
                        {solicitacao.souDono ? (
                            <AcoesDono solicitacao={solicitacao} atualizar={atualizar} />
                        ) : (
                            <AcoesVisitante solicitacao={solicitacao} />
                        )}
                    </section>

                    <InfoBanner title='Dicas de segurança' icon={<ShieldCheck size={18} />}>
                        Combinem a entrega em um lugar público e movimentado. Não compartilhe seu endereço.
                    </InfoBanner>
                </aside>
            </div>
        </div>
    );
}

export default DetalheSolicitacao;
