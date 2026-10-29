import { LoaderCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

import AvisoPagina from '@/features/solicitacao/AvisoPagina';
import FormularioSolicitacao from '@/features/solicitacao/FormularioSolicitacao';
import { formularioDe } from '@/features/solicitacao/formulario';
import { sincronizarFoto } from '@/features/solicitacao/fotos';
import { useSolicitacao } from '@/hooks/useSolicitacao';
import { ApiError } from '@/services/api';
import { editarSolicitacao } from '@/services/solicitacoes';

/** Edição de um pedido aberto (`/pedidos/:id/editar`). */
function EditarSolicitacao() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { solicitacao, carregando, erro } = useSolicitacao(id);

    if (carregando) {
        return (
            <p role='status' className='flex items-center justify-center gap-2 py-16 text-body-l text-muted'>
                <LoaderCircle size={20} className='animate-spin' aria-hidden />
                Carregando…
            </p>
        );
    }
    if (erro || !solicitacao) return <AvisoPagina titulo='Algo deu errado' mensagem={erro ?? undefined} />;

    // A API também confere (403/409); aqui é só para não mostrar um formulário que não vai funcionar.
    if (!solicitacao.souDono || solicitacao.situacao !== 'ABERTA') {
        return (
            <AvisoPagina
                titulo='Este pedido não pode ser editado'
                mensagem='Só quem fez o pedido pode editá-lo, e só enquanto ele estiver aberto.'
                voltarPara={`/pedidos/${solicitacao.id}`}
                textoVoltar='Ver o pedido'
            />
        );
    }

    const inicial = formularioDe(solicitacao);

    return (
        <FormularioSolicitacao
            key={solicitacao.id}
            modo='edicao'
            inicial={inicial}
            saidaPara={`/pedidos/${solicitacao.id}`}
            aoEnviar={async (dados, foto) => {
                await editarSolicitacao(solicitacao.id, dados);
                // Os textos já foram salvos; se só a foto falhar, a pessoa é avisada no detalhe.
                let aviso = 'Pronto! Seu pedido foi atualizado.';
                try {
                    await sincronizarFoto(solicitacao.id, inicial.foto, foto);
                } catch (e) {
                    const motivo = e instanceof ApiError ? ` ${e.message}` : '';
                    aviso = `Seu pedido foi atualizado, mas a foto não foi alterada.${motivo}`;
                }
                navigate(`/pedidos/${solicitacao.id}`, { state: { aviso } });
            }}
        />
    );
}

export default EditarSolicitacao;
