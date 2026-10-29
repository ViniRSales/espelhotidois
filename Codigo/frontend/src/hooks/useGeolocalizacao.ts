import { useState } from 'react';

import { bairroDasCoordenadas, type BairroCidade } from '@/services/localizacao';

type Situacao = 'ocioso' | 'buscando' | 'erro';

const MENSAGENS = {
  semSuporte: 'Seu navegador não informa a localização. Você pode digitar o bairro e a cidade.',
  semPermissao: 'Sem permissão para usar sua localização. Você pode digitar o bairro e a cidade.',
  falhou: 'Não conseguimos sua localização agora. Você pode digitar o bairro e a cidade.',
  semBairro: 'Não encontramos o bairro dessa localização. Você pode digitar o bairro e a cidade.',
};

function posicaoAtual() {
  return new Promise<GeolocationPosition>((resolver, rejeitar) => {
    navigator.geolocation.getCurrentPosition(resolver, rejeitar, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
  });
}

/** "Usar minha localização atual": pede a posição ao navegador e a converte em bairro e cidade. */
export function useGeolocalizacao() {
  const [situacao, setSituacao] = useState<Situacao>('ocioso');
  const [mensagem, setMensagem] = useState<string | null>(null);

  function falhar(texto: string) {
    setSituacao('erro');
    setMensagem(texto);
    return null;
  }

  async function localizar(): Promise<BairroCidade | null> {
    if (!('geolocation' in navigator)) return falhar(MENSAGENS.semSuporte);

    setSituacao('buscando');
    setMensagem(null);
    let posicao: GeolocationPosition;
    try {
      posicao = await posicaoAtual();
    } catch (erro) {
      const negado = (erro as GeolocationPositionError).code === 1;
      return falhar(negado ? MENSAGENS.semPermissao : MENSAGENS.falhou);
    }

    try {
      const local = await bairroDasCoordenadas({ lat: posicao.coords.latitude, lon: posicao.coords.longitude });
      if (!local.bairro && !local.cidade) return falhar(MENSAGENS.semBairro);
      setSituacao('ocioso');
      return local;
    } catch {
      return falhar(MENSAGENS.falhou);
    }
  }

  return { localizar, buscando: situacao === 'buscando', mensagem };
}
