import { ClipboardCheck } from 'lucide-react';

import Button from '@/components/Button/Button';
import InfoBanner from '@/components/InfoBanner';
import { DOACAO } from '@/config/doacao';
import { rotuloCondicao, rotuloFormaEntrega } from '@/types/doacao';
import { formatarData, somarDias } from '@/utils/datas';

import PreviaAnuncio from '../PreviaAnuncio';
import { useCadastroDoacao } from '../useCadastroDoacao';

interface LinhaProps {
    campo: string;
    valor: string;
    etapa: number;
    onEditar: (etapa: number) => void;
}

function Linha({ campo, valor, etapa, onEditar }: LinhaProps) {
    return (
        <div className='flex items-start justify-between gap-4 border-b border-border/10 py-4 last:border-b-0'>
            <div className='flex min-w-0 flex-col gap-1.5'>
                <dt className='text-subtitle-s'>{campo}</dt>
                <dd className='text-body leading-snug break-words text-muted'>{valor}</dd>
            </div>
            <Button variant='link' onClick={() => onEditar(etapa)} aria-label={`Editar ${campo.toLocaleLowerCase('pt-BR')}`}>
                Editar
            </Button>
        </div>
    );
}

/** Etapa 5: prévia final e resumo de tudo, com atalho para editar cada parte. */
function EtapaRevisao() {
    const { estado, irParaEtapa, categoriaEscolhida, ehAlimento } = useCadastroDoacao();
    const f = estado.formulario;
    const juntar = (...partes: (string | false | null | undefined)[]) => partes.filter(Boolean).join(' · ') || '—';

    const fotos = f.fotos.length === 1 ? '1 foto' : `${f.fotos.length} fotos`;
    const validade = ehAlimento && (f.naoPerecivel ? 'Não perecível' : f.validade && `Validade: ${formatarData(`${f.validade}T12:00:00`)}`);
    const tags = f.tags.length > 0 && `Tags: ${f.tags.join(', ')}`;
    const prazo = formatarData(somarDias(new Date(), DOACAO.diasDisponivel));

    return (
        <div className='flex flex-col gap-8'>
            <div className='max-w-sm'>
                <PreviaAnuncio titulo='Como seu anúncio vai aparecer' legenda='Assim outras pessoas vão ver o seu item.' />
            </div>

            <section aria-labelledby='resumo' className='flex flex-col gap-2'>
                <h3 id='resumo' className='text-subtitle'>Resumo</h3>
                <dl className='flex flex-col'>
                    <Linha campo='Nome e mídia' valor={juntar(f.titulo.trim(), fotos)} etapa={1} onEditar={irParaEtapa} />
                    <Linha campo='Categoria' valor={juntar(categoriaEscolhida?.nome, validade, tags)} etapa={2} onEditar={irParaEtapa} />
                    <Linha
                        campo='Condição e entrega'
                        valor={juntar(rotuloCondicao(f.condicao), f.formasEntrega.map(rotuloFormaEntrega).join(', '))}
                        etapa={3}
                        onEditar={irParaEtapa}
                    />
                    <Linha
                        campo='Disponibilidade'
                        valor={`${DOACAO.diasDisponivel} dias a partir da publicação (até ${prazo})`}
                        etapa={3}
                        onEditar={irParaEtapa}
                    />
                    <Linha campo='Localização' valor={juntar(f.bairro.trim(), f.cidade.trim())} etapa={4} onEditar={irParaEtapa} />
                </dl>
            </section>

            <InfoBanner title='Revise antes de publicar' icon={<ClipboardCheck size={18} />}>
                Depois de publicado, o item fica visível para pessoas próximas. Confira as fotos e a descrição.
            </InfoBanner>
        </div>
    );
}

export default EtapaRevisao;
