import { MapPin } from 'lucide-react';

import type { Localizacao } from '@/types/doacao';
import type { Urgencia } from '@/types/solicitacao';

import { textoLocalizacao } from './formatos';
import UrgenciaBadge from './UrgenciaBadge';

interface SolicitacaoCardProps {
    titulo: string;
    descricao?: string | null;
    nomeCategoria?: string;
    urgencia: Urgencia | null;
    localizacao: Localizacao | null;
    /** Foto de referência; sem ela, o cartão não reserva espaço para imagem. */
    fotoUrl?: string;
}

/**
 * Cartão de um pedido como aparece para outras pessoas, no estilo do ItemCard. Também serve de pré-visualização
 * no cadastro. Não mostra nada que identifique quem pediu.
 */
function SolicitacaoCard({ titulo, descricao, nomeCategoria, urgencia, localizacao, fotoUrl }: SolicitacaoCardProps) {
    const local = textoLocalizacao(localizacao);

    return (
        <article className='overflow-hidden rounded-2xl border border-border/15 bg-surface'>
            {fotoUrl && (
                <div className='aspect-[16/10] bg-border/5'>
                    <img src={fotoUrl} alt='Foto de referência do pedido' className='size-full object-cover' />
                </div>
            )}
            <div className='flex flex-col gap-3 p-4'>
                {(urgencia || nomeCategoria) && (
                    <div className='flex flex-wrap gap-2'>
                        {urgencia && <UrgenciaBadge urgencia={urgencia} />}
                        {nomeCategoria && (
                            <span className='rounded-md bg-background px-2 py-1 text-caption-medium'>{nomeCategoria}</span>
                        )}
                    </div>
                )}
                <h3 className='text-card-title leading-snug break-words'>{titulo.trim() || 'Título do pedido'}</h3>
                <p className='line-clamp-3 text-body leading-snug break-words text-muted'>
                    {descricao?.trim() || 'A descrição do pedido aparece aqui.'}
                </p>
                <span className='flex items-center gap-1 text-caption text-muted'>
                    <MapPin size={16} aria-hidden />
                    {local || 'Seu bairro'}
                </span>
            </div>
        </article>
    );
}

export default SolicitacaoCard;
