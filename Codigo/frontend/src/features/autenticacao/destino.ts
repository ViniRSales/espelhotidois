// Para onde voltar depois do login. Guardado no `state` da navegação pela RotaProtegida.

export type EstadoRedirecionamento = { de?: string };

/**
 * Só aceita caminhos internos (`/adicionar`), nunca outro site (`//exemplo.com`, `https://…`):
 * assim um link malicioso não consegue mandar a pessoa para fora do Doapp depois do login.
 */
export function destinoAposLogin(estado: unknown) {
  const de = (estado as EstadoRedirecionamento | null)?.de;
  return typeof de === 'string' && de.startsWith('/') && !de.startsWith('//') ? de : '/';
}
