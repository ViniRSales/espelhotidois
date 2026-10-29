import { ShieldCheck } from 'lucide-react';

import Button from '@/components/Button/Button';
import InfoBanner from '@/components/InfoBanner';
import { URGENCIAS } from '@/types/solicitacao';

import { textoLocalizacao } from './formatos';
import type { Formulario } from './formulario';
import SolicitacaoCard from './SolicitacaoCard';

interface EtapaRevisarProps {
    formulario: Formulario;
    nomeCategoria?: string;
    irPara: (etapa: number) => void;
}

function EtapaRevisar({ formulario, nomeCategoria, irPara }: EtapaRevisarProps) {
    const localizacao = { bairro: formulario.bairro, cidade: formulario.cidade };
    const urgencia = URGENCIAS.find((opcao) => opcao.valor === formulario.urgencia);

    const linhas = [
        { rotulo: 'Título e descrição', valor: formulario.titulo.trim(), etapa: 0 },
        { rotulo: 'Foto de referência', valor: formulario.foto ? 'Adicionada' : 'Sem foto', etapa: 0 },
        { rotulo: 'Categoria', valor: nomeCategoria ?? '', etapa: 1 },
        { rotulo: 'Para quando', valor: urgencia ? `${urgencia.rotulo} · ${urgencia.descricao}` : '', etapa: 1 },
        { rotulo: 'Onde', valor: textoLocalizacao(localizacao) || 'Não informado', etapa: 1 },
    ];

    return (
        <>
            <section aria-label='Pré-visualização' className='flex flex-col items-center gap-3 rounded-2xl bg-background p-4 md:p-6'>
                <h3 className='text-subtitle-s'>Pré-visualização</h3>
                <div className='w-full max-w-md'>
                    <SolicitacaoCard
                        titulo={formulario.titulo}
                        descricao={formulario.descricao}
                        nomeCategoria={nomeCategoria}
                        urgencia={formulario.urgencia}
                        localizacao={localizacao}
                        fotoUrl={formulario.foto?.url}
                    />
                </div>
                <p className='text-caption text-muted'>É assim que seu pedido aparece na busca e nas sugestões.</p>
            </section>

            <section aria-labelledby='resumo-pedido' className='flex flex-col'>
                <h3 id='resumo-pedido' className='text-subtitle'>Resumo</h3>
                <dl>
                    {linhas.map(({ rotulo, valor, etapa }) => (
                        <div
                            key={rotulo}
                            className='grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-b border-border/10 py-3 sm:grid-cols-[11rem_minmax(0,1fr)_auto]'
                        >
                            <dt className='col-start-1 row-start-1 text-subtitle-s'>{rotulo}</dt>
                            <dd className='col-start-1 row-start-2 text-body leading-snug break-words sm:col-start-2 sm:row-start-1'>
                                {valor}
                            </dd>
                            <dd className='col-start-2 row-start-1 sm:col-start-3'>
                                <Button variant='link' onClick={() => irPara(etapa)} className='min-h-11'>
                                    Alterar<span className='sr-only'> {rotulo.toLowerCase()}</span>
                                </Button>
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>

            <InfoBanner title='Seus contatos ficam guardados' icon={<ShieldCheck size={18} />}>
                Nome, telefone e e-mail não aparecem no pedido. Depois de publicado, você ainda pode editar o pedido ou
                cancelá-lo quando conseguir o que precisa.
            </InfoBanner>
        </>
    );
}

export default EtapaRevisar;
