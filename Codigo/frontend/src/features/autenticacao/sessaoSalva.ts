const CHAVE = 'doapp.sessao';

export type SessaoSalva = { token: string; expiraEm: string };

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
    return;
  }
}

export function apagarSessaoSalva() {
  for (const armazenamento of [storage('localStorage'), storage('sessionStorage')]) {
    try {
      armazenamento?.removeItem(CHAVE);
    } catch {
      continue;
    }
  }
}
