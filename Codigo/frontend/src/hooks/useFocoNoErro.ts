import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Depois de um envio com erro, leva o foco ao primeiro campo inválido do formulário
 * (ou ao aviso geral, se nenhum campo estiver marcado). Ajuda quem usa teclado e leitor de tela.
 */
export function useFocoNoErro() {
  const formularioRef = useRef<HTMLFormElement>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (tentativa === 0) return;
    const alvo = formularioRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-erro-geral]');
    alvo?.focus();
  }, [tentativa]);

  const focarErro = useCallback(() => setTentativa((atual) => atual + 1), []);

  return { formularioRef, focarErro };
}
