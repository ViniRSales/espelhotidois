import { useState } from 'react';

import Button from '@/components/Button/Button';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ApiError } from '@/services/api';
import { cancelarSolicitacao } from '@/services/solicitacoes';
import type { Solicitacao } from '@/types/solicitacao';

interface CancelarSolicitacaoProps {
    solicitacaoId: string;
    aoCancelar: (solicitacao: Solicitacao) => void;
}

/** Botão "Cancelar pedido" com confirmação antes, já que o pedido cancelado não pode ser reaberto. */
function CancelarSolicitacao({ solicitacaoId, aoCancelar }: CancelarSolicitacaoProps) {
    const [aberto, setAberto] = useState(false);
    const [cancelando, setCancelando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    function abrir() {
        setErro(null);
        setAberto(true);
    }

    async function confirmar() {
        setCancelando(true);
        setErro(null);
        try {
            const cancelada = await cancelarSolicitacao(solicitacaoId);
            setAberto(false);
            aoCancelar(cancelada);
        } catch (e) {
            setErro(e instanceof ApiError ? e.message : 'Não foi possível cancelar. Tente de novo em instantes.');
        } finally {
            setCancelando(false);
        }
    }

    return (
        <>
            <Button variant='link' onClick={abrir} className='min-h-11 self-center'>Cancelar pedido</Button>

            <ConfirmDialog
                open={aberto}
                title='Cancelar este pedido?'
                description={
                    <>
                        <p>Ele deixa de aparecer para as pessoas. Depois de cancelado, não dá para reabrir.</p>
                        {erro && <p role='alert' className='mt-3 text-body text-danger'>{erro}</p>}
                    </>
                }
                onCancel={() => setAberto(false)}
            >
                <Button variant='outline' onClick={() => setAberto(false)} disabled={cancelando}>Manter pedido</Button>
                <Button onClick={confirmar} loading={cancelando}>Sim, cancelar pedido</Button>
            </ConfirmDialog>
        </>
    );
}

export default CancelarSolicitacao;
