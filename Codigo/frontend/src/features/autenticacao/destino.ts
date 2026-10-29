export type EstadoRedirecionamento = { de?: string };

export function destinoAposLogin(estado: unknown) {
  const de = (estado as EstadoRedirecionamento | null)?.de;
  return typeof de === 'string' && de.startsWith('/') && !de.startsWith('//') ? de : '/';
}
