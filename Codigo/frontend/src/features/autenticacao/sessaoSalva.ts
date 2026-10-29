// Onde o token de login fica guardado no navegador.
// "Manter conectado" usa o localStorage (sobrevive a fechar o navegador); sem ele, o sessionStorage (só esta aba).

const CHAVE = 'doapp.sessao';

export type SessaoSalva = { token: string; expiraEm: string };

/** O storage pode não existir ou lançar erro (modo privado, cookies bloqueados): nesses casos, segue sem salvar. */
function storage(tipo: 'localStorage' | 'sessionStorage'): Storage | null {
  try {
    return window[tipo];
  } catch {
    return null;
  }
}

function ler(armazenamento: Storage | null): SessaoSalva | null {
  try {
    const dados = JSON.parse(armazenamento?.getItem(CHAVE) ?? 'null');
    return typeof dados?.token === 'string' && typeof dados?.expiraEm === 'string' ? dados : null;
  } catch {
    return null;
  }
}

/** Sessão salva que ainda não venceu. Uma sessão vencida ou corrompida é apagada. */
export function lerSessaoSalva(agora = Date.now()): SessaoSalva | null {
  const sessao = ler(storage('localStorage')) ?? ler(storage('sessionStorage'));
  if (!sessao) {
    apagarSessaoSalva();
    return null;
  }
  const expiraEm = Date.parse(sessao.expiraEm);
  if (Number.isNaN(expiraEm) || expiraEm <= agora) {
    apagarSessaoSalva();
    return null;
  }
  return sessao;
}

export function salvarSessao(sessao: SessaoSalva, manterConectado: boolean) {
  apagarSessaoSalva();
  try {
    storage(manterConectado ? 'localStorage' : 'sessionStorage')?.setItem(CHAVE, JSON.stringify(sessao));
  } catch {
    // Sem storage, a sessão vale só enquanto a página estiver aberta.
  }
}

export function apagarSessaoSalva() {
  for (const armazenamento of [storage('localStorage'), storage('sessionStorage')]) {
    try {
      armazenamento?.removeItem(CHAVE);
    } catch {
      // Nada a apagar.
    }
  }
}
