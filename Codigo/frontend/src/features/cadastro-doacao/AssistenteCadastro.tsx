import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import TipsCard from '@/components/TipsCard';

import CadastroLayout from './CadastroLayout';
import ConfirmarSaidaDialog from './ConfirmarSaidaDialog';
import { CONTEUDO_ETAPAS } from './etapas';
import PreviaAnuncio from './PreviaAnuncio';
import StepCard from './StepCard';
import { useCadastroDoacao } from './useCadastroDoacao';
import { useConfirmarSaida } from './useConfirmarSaida';
import { TOTAL_ETAPAS } from './validacao';

const TEMPO_CONFIRMACAO_MS = 4000;

/** O assistente de cadastro: etapa atual, prévia, URL e o aviso ao sair. */
function AssistenteCadastro() {
    const cadastro = useCadastroDoacao();
    const { estado } = cadastro;
    const navigate = useNavigate();
    const location = useLocation();
    const [confirmacao, setConfirmacao] = useState<string | null>(null);
    const [saindo, setSaindo] = useState<'descartar' | 'manter' | null>(null);
    const [erroSaida, setErroSaida] = useState<string | null>(null);

    const blocker = useConfirmarSaida({ haRascunho: estado.id !== null || estado.sujo, naoSalvo: estado.sujo });

    // A URL acompanha o rascunho e a etapa, para recarregar a página ou voltar depois no mesmo ponto.
    useEffect(() => {
        if (!estado.id) return;
        const destino = `/adicionar/item/${estado.id}?etapa=${estado.etapa}`;
        if (`${location.pathname}${location.search}` !== destino) navigate(destino, { replace: true });
    }, [estado.id, estado.etapa, location.pathname, location.search, navigate]);

    useEffect(() => {
        if (!confirmacao) return;
        const timer = window.setTimeout(() => setConfirmacao(null), TEMPO_CONFIRMACAO_MS);
        return () => window.clearTimeout(timer);
    }, [confirmacao]);

    const etapa = CONTEUDO_ETAPAS[estado.etapa - 1];
    const ultima = estado.etapa === TOTAL_ETAPAS;
    const ocupado = estado.salvando || estado.enviandoFotos > 0;

    async function avancar() {
        if (!ultima) {
            await cadastro.continuar();
            return;
        }
        const publicada = await cadastro.publicar();
        if (publicada) navigate(`/adicionar/item/${publicada.id}/publicado`, { replace: true });
    }

    async function salvarRascunho() {
        if (await cadastro.salvarRascunho()) setConfirmacao('Rascunho salvo.');
    }

    async function sair(acao: 'descartar' | 'manter') {
        setSaindo(acao);
        setErroSaida(null);
        const ok = acao === 'descartar' ? await cadastro.descartar() : !estado.sujo || await cadastro.salvarRascunho();
        setSaindo(null);
        if (ok) {
            blocker.proceed?.();
        } else {
            setErroSaida(acao === 'descartar'
                ? 'Não conseguimos descartar o rascunho. Tente de novo.'
                : 'Não conseguimos salvar o rascunho. Tente de novo.');
        }
    }

    function continuarNoCadastro() {
        setErroSaida(null);
        blocker.reset?.();
    }

    const Conteudo = etapa.Conteudo;
    const lateral = etapa.dicas && (
        <>
            <PreviaAnuncio />
            <TipsCard tips={etapa.dicas} />
        </>
    );

    return (
        <>
            <CadastroLayout lateral={lateral}>
                <StepCard
                    etapa={estado.etapa}
                    total={TOTAL_ETAPAS}
                    titulo={etapa.titulo}
                    descricao={etapa.descricao}
                    rotuloAvancar={ultima ? 'Publicar' : 'Continuar'}
                    onAvancar={avancar}
                    onVoltar={estado.etapa > 1 ? cadastro.voltar : undefined}
                    onSalvarRascunho={salvarRascunho}
                    ocupado={ocupado}
                    status={confirmacao}
                    erroGeral={estado.erroGeral}
                >
                    {Conteudo && <Conteudo />}
                </StepCard>
            </CadastroLayout>

            <ConfirmarSaidaDialog
                open={blocker.state === 'blocked'}
                ocupado={saindo}
                erro={erroSaida}
                onCancelar={continuarNoCadastro}
                onDescartar={() => sair('descartar')}
                onManter={() => sair('manter')}
            />
        </>
    );
}

export default AssistenteCadastro;
