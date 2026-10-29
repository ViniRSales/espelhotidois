import { useCallback, useEffect, useRef, useState } from 'react';

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
