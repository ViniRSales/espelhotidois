import { useEffect, useState } from 'react';

import { ApiError } from '@/services/api';
import { buscarSolicitacao } from '@/services/solicitacoes';
import type { Solicitacao } from '@/types/solicitacao';

type Resultado = { id: string; solicitacao: Solicitacao | null; erro: string | null };

function mensagemDeErro(e: unknown) {
  if (e instanceof ApiError && e.status === 404) return 'Não encontramos este pedido. Ele pode ter sido removido.';
  if (e instanceof ApiError) return e.message;
  return 'Não foi possível carregar o pedido.';
}

/** Pedido vindo da API (GET /api/solicitacoes/{id}); `atualizar` troca pelo que a API devolveu depois de uma ação. */
export function useSolicitacao(id: string | undefined) {
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    if (!id) return;
    let ativo = true;
    buscarSolicitacao(id)
      .then((solicitacao) => ativo && setResultado({ id, solicitacao, erro: null }))
      .catch((e: unknown) => ativo && setResultado({ id, solicitacao: null, erro: mensagemDeErro(e) }));
    return () => {
      ativo = false;
    };
  }, [id]);

  // Enquanto o pedido do id atual não chega, o resultado de um id anterior é ignorado.
  const atual = resultado?.id === id ? resultado : null;

  return {
    solicitacao: atual?.solicitacao ?? null,
    carregando: !!id && !atual,
    erro: id ? (atual?.erro ?? null) : 'Não encontramos este pedido.',
    atualizar: (solicitacao: Solicitacao) => setResultado({ id: solicitacao.id, solicitacao, erro: null }),
  };
}
