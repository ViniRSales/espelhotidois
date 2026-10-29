import { useNavigate } from 'react-router';

import FormularioSolicitacao from '@/features/solicitacao/FormularioSolicitacao';
import { FORMULARIO_VAZIO } from '@/features/solicitacao/formulario';
import { sincronizarFoto } from '@/features/solicitacao/fotos';
import { ApiError } from '@/services/api';
import { cadastrarSolicitacao } from '@/services/solicitacoes';

/** Cadastro de pedido (`/adicionar/pedido`). */
function NovaSolicitacao() {
    const navigate = useNavigate();

    return (
        <FormularioSolicitacao
            modo='cadastro'
            inicial={FORMULARIO_VAZIO}
            saidaPara='/adicionar'
            aoEnviar={async (dados, foto) => {
                const criada = await cadastrarSolicitacao(dados);
                // O pedido já está publicado; se só a foto falhar, a pessoa é avisada e pode tentar de novo editando.
                let aviso: string | undefined;
                try {
                    await sincronizarFoto(criada.id, null, foto);
                } catch (e) {
                    const motivo = e instanceof ApiError ? ` ${e.message}` : '';
                    aviso = `Seu pedido foi publicado, mas a foto não foi enviada.${motivo} Você pode adicioná-la editando o pedido.`;
                }
                navigate(`/adicionar/pedido/${criada.id}/publicado`, { state: aviso ? { aviso } : null });
            }}
        />
    );
}

export default NovaSolicitacao;
