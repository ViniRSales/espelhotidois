const FORMATO_DATA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Data no formato dd/mm/aaaa, no fuso do navegador. */
export function formatarData(data: Date | string) {
  return FORMATO_DATA.format(typeof data === 'string' ? new Date(data) : data);
}

export function somarDias(data: Date, dias: number) {
  const resultado = new Date(data);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}
