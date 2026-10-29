import { LoaderCircle, LocateFixed, MapPinned, ShieldCheck } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';

import Button from '@/components/Button/Button';
import TextField from '@/components/Field/TextField';
import InfoBanner from '@/components/InfoBanner';
import { DOACAO } from '@/config/doacao';
import { useGeolocalizacao } from '@/hooks/useGeolocalizacao';
import { coordenadasDoBairro, type Coordenadas } from '@/services/localizacao';

import { useCadastroDoacao } from '../useCadastroDoacao';

// O Leaflet é pesado; só é baixado quando o mapa aparece.
const MapaAproximado = lazy(() => import('../MapaAproximado'));

/** Espera entre a digitação e a busca no mapa (o Nominatim aceita no máximo 1 requisição por segundo). */
const ESPERA_BUSCA_MS = 800;

type BuscaMapa = { chave: string; centro: Coordenadas | null; falhou: boolean };

function Aviso({ carregando, children }: { carregando?: boolean; children: string }) {
    return (
        <div className='flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/25 bg-background p-4 text-center text-body text-muted'>
            {carregando ? <LoaderCircle size={24} className='animate-spin' aria-hidden /> : <MapPinned size={24} aria-hidden />}
            <p role='status' className='leading-snug'>{children}</p>
        </div>
    );
}

/** Etapa 4: bairro e cidade, com a opção de usar a localização atual e um mapa aproximado. */
function EtapaLocalizacao() {
    const { estado, alterar } = useCadastroDoacao();
    const { formulario, erros } = estado;
    const geolocalizacao = useGeolocalizacao();
    const [busca, setBusca] = useState<BuscaMapa | null>(null);

    const bairro = formulario.bairro.trim();
    const cidade = formulario.cidade.trim();
    const completo = bairro.length >= DOACAO.localMinimo && cidade.length >= DOACAO.localMinimo;
    const chave = `${bairro}|${cidade}`.toLocaleLowerCase('pt-BR');

    useEffect(() => {
        if (!completo) return;
        let ativo = true;
        const timer = window.setTimeout(() => {
            coordenadasDoBairro({ bairro, cidade })
                .then((centro) => ativo && setBusca({ chave, centro, falhou: false }))
                .catch(() => ativo && setBusca({ chave, centro: null, falhou: true }));
        }, ESPERA_BUSCA_MS);
        return () => {
            ativo = false;
            window.clearTimeout(timer);
        };
    }, [completo, bairro, cidade, chave]);

    async function usarLocalizacaoAtual() {
        const local = await geolocalizacao.localizar();
        if (local) alterar({ bairro: local.bairro, cidade: local.cidade });
    }

    // Só vale o resultado da busca feita para o bairro e a cidade que estão nos campos agora.
    const resultado = busca?.chave === chave ? busca : null;
    let mapa;
    if (!completo) {
        mapa = <Aviso>O mapa aparece quando você informar o bairro e a cidade.</Aviso>;
    } else if (!resultado) {
        mapa = <Aviso carregando>Procurando o bairro no mapa…</Aviso>;
    } else if (resultado.centro) {
        mapa = (
            <Suspense fallback={<Aviso carregando>Carregando o mapa…</Aviso>}>
                <MapaAproximado centro={resultado.centro} bairro={bairro} />
            </Suspense>
        );
    } else {
        mapa = (
            <Aviso>
                {resultado.falhou
                    ? 'Não conseguimos carregar o mapa agora. Isso não impede o cadastro.'
                    : 'Não achamos esse bairro no mapa. Confira o nome; o cadastro continua valendo.'}
            </Aviso>
        );
    }

    return (
        <div className='flex flex-col gap-6'>
            <div className='grid gap-4 sm:grid-cols-2'>
                <TextField
                    label='Bairro'
                    placeholder='Ex.: Ipiranga'
                    autoComplete='address-level3'
                    value={formulario.bairro}
                    onChange={(evento) => alterar({ bairro: evento.target.value })}
                    maxLength={DOACAO.localMaximo}
                    error={erros.bairro}
                />
                <TextField
                    label='Cidade'
                    placeholder='Ex.: Belo Horizonte'
                    autoComplete='address-level2'
                    value={formulario.cidade}
                    onChange={(evento) => alterar({ cidade: evento.target.value })}
                    maxLength={DOACAO.localMaximo}
                    error={erros.cidade}
                />
            </div>

            <div className='flex flex-col items-start gap-2'>
                <Button
                    variant='outline'
                    icon={<LocateFixed size={18} aria-hidden />}
                    loading={geolocalizacao.buscando}
                    onClick={usarLocalizacaoAtual}
                >
                    Usar minha localização atual
                </Button>
                {geolocalizacao.mensagem && (
                    <p role='alert' className='text-caption-medium leading-snug text-danger'>{geolocalizacao.mensagem}</p>
                )}
            </div>

            <section aria-label='Mapa aproximado' className='flex flex-col gap-2'>
                {mapa}
                {completo && resultado?.centro && (
                    <p className='text-caption text-muted'>Área aproximada · {bairro}</p>
                )}
            </section>

            <InfoBanner title='Sua privacidade está protegida' icon={<ShieldCheck size={18} />}>
                Quem vê o anúncio só sabe o bairro e a distância aproximada. O endereço exato você combina pelo chat, se quiser.
            </InfoBanner>
        </div>
    );
}

export default EtapaLocalizacao;
