import { useEffect } from 'react';
import { useBlocker } from 'react-router';

/** Caminhos que continuam dentro do cadastro de item (inclusive a tela de publicado). */
const DENTRO_DO_CADASTRO = '/adicionar/item';

/**
 * Segura a navegação para fora do cadastro enquanto houver rascunho (salvo ou não), para perguntar o que fazer
 * com ele. Fechar ou recarregar a aba com alterações não salvas mostra o aviso nativo do navegador.
 */
export function useConfirmarSaida({ haRascunho, naoSalvo }: { haRascunho: boolean; naoSalvo: boolean }) {
  const blocker = useBlocker(({ nextLocation }) => haRascunho && !nextLocation.pathname.startsWith(DENTRO_DO_CADASTRO));

  useEffect(() => {
    if (!naoSalvo) return;
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault();
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [naoSalvo]);

  return blocker;
}
