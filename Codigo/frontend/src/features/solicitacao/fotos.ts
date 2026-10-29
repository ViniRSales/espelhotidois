import { enviarFotoSolicitacao, removerFotoSolicitacao } from '@/services/solicitacoes';

import type { FotoFormulario } from './formulario';

/**
 * Leva para o pedido já salvo a mudança de foto feita no formulário: apaga a foto antiga, se ela foi trocada
 * ou removida, e envia a nova, se houver. A foto precisa do id do pedido, por isso vai depois de salvá-lo.
 */
export async function sincronizarFoto(solicitacaoId: string, anterior: FotoFormulario | null, atual: FotoFormulario | null) {
  if (anterior?.id && anterior.id !== atual?.id) {
    await removerFotoSolicitacao(solicitacaoId, anterior.id);
  }
  if (atual?.arquivo) {
    await enviarFotoSolicitacao(solicitacaoId, atual.arquivo);
  }
}
