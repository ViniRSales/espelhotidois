import { useState } from 'react';

import { localDasCoordenadas, type LocalSugerido } from '@/services/localizacao';

const MENSAGENS = {
  semSuporte: 'Seu navegador não informa a localização. Digite seu bairro.',
  semPermissao: 'Sem permissão para usar sua localização. Digite seu bairro.',
  falhou: 'Não conseguimos sua localização agora. Digite seu bairro.',
  semBairro: 'Não encontramos o bairro dessa localização. Digite seu bairro.',
};

function posicaoAtual() {
  return new Promise<GeolocationPosition>((resolver, rejeitar) => {
    navigator.geolocation.getCurrentPosition(resolver, rejeitar, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
  });
}

/**
 * "Usar minha localização atual" do cadastro de conta: pede a posição ao navegador e a converte em bairro, cidade
 * e UF. É o mesmo caminho do `useGeolocalizacao` do cadastro de doação, mas também traz o estado.
 * A posição exata nunca é guardada nem enviada à API: só o bairro.
 */
export function useLocalizacaoAtual() {
  const [buscando, setBuscando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function localizar(): Promise<LocalSugerido | null> {
    setMensagem(null);
    if (!('geolocation' in navigator)) {
      setMensagem(MENSAGENS.semSuporte);
      return null;
    }
    setBuscando(true);
    try {
      let posicao: GeolocationPosition;
      try {
        posicao = await posicaoAtual();
      } catch (erro) {
        setMensagem((erro as GeolocationPositionError).code === 1 ? MENSAGENS.semPermissao : MENSAGENS.falhou);
        return null;
      }
      const local = await localDasCoordenadas({ lat: posicao.coords.latitude, lon: posicao.coords.longitude })
        .catch(() => undefined);
      if (local === undefined) setMensagem(MENSAGENS.falhou);
      else if (local === null) setMensagem(MENSAGENS.semBairro);
      return local ?? null;
    } finally {
      setBuscando(false);
    }
  }

  return { localizar, buscando, mensagem };
}
