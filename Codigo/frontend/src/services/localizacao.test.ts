import { afterEach, describe, expect, it, vi } from 'vitest';

import { buscarBairros, formatarLocal, localDasCoordenadas } from './localizacao';

function feature(propriedades: Record<string, string>) {
  return { properties: { countrycode: 'BR', osm_key: 'place', state: 'Minas Gerais', ...propriedades } };
}

function responder(features: unknown[], ok = true) {
  const fetch = vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve({ features }) });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('buscarBairros', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('separa bairro, cidade e UF e busca só bairros no Brasil', async () => {
    const fetch = responder([feature({ name: 'Savassi', city: 'Belo Horizonte' })]);

    expect(await buscarBairros('Sava')).toEqual([{ bairro: 'Savassi', cidade: 'Belo Horizonte', uf: 'MG' }]);
    const url = new URL(fetch.mock.calls[0][0] as string);
    expect(url.searchParams.get('q')).toBe('Sava');
    expect(url.searchParams.getAll('layer')).toEqual(['district', 'locality']);
    expect(url.searchParams.get('bbox')).toBe('-74,-34,-34,6');
  });

  it('ignora repetidos, outros países, condomínios e resultados sem cidade ou estado', async () => {
    responder([
      feature({ name: 'Savassi', city: 'Belo Horizonte' }),
      feature({ name: 'Savassi', city: 'Belo Horizonte', osm_key: 'boundary' }),
      feature({ name: 'Parque Savassi', city: 'Suzano', osm_key: 'landuse' }),
      feature({ name: 'Savassi', city: 'Lisboa', countrycode: 'PT' }),
      feature({ name: 'Savassi' }),
      feature({ name: 'Savassi', city: 'Cidade', state: 'Estado inventado' }),
    ]);

    expect(await buscarBairros('Savassi')).toEqual([{ bairro: 'Savassi', cidade: 'Belo Horizonte', uf: 'MG' }]);
  });

  it('falha quando o serviço responde com erro', async () => {
    responder([], false);

    await expect(buscarBairros('Sava')).rejects.toThrow('Não conseguimos buscar os bairros agora.');
  });
});

describe('formatarLocal', () => {
  it('mostra bairro, cidade e UF', () => {
    expect(formatarLocal({ bairro: 'Savassi', cidade: 'Belo Horizonte', uf: 'MG' })).toBe('Savassi, Belo Horizonte - MG');
  });
});

describe('localDasCoordenadas', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function endereco(address: Record<string, string>) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ address }) }));
  }

  it('devolve bairro, cidade e a UF do código ISO', async () => {
    endereco({ suburb: 'Savassi', city: 'Belo Horizonte', 'ISO3166-2-lvl4': 'BR-MG', country_code: 'br' });

    expect(await localDasCoordenadas({ lat: -19.93, lon: -43.93 }))
      .toEqual({ bairro: 'Savassi', cidade: 'Belo Horizonte', uf: 'MG' });
  });

  it('sem o código ISO, usa o nome do estado', async () => {
    endereco({ neighbourhood: 'Centro', town: 'Contagem', state: 'Minas Gerais' });

    expect(await localDasCoordenadas({ lat: 0, lon: 0 })).toEqual({ bairro: 'Centro', cidade: 'Contagem', uf: 'MG' });
  });

  it('fora do Brasil ou sem bairro, devolve null', async () => {
    endereco({ suburb: 'Alfama', city: 'Lisboa', country_code: 'pt' });
    expect(await localDasCoordenadas({ lat: 0, lon: 0 })).toBeNull();

    endereco({ city: 'Belo Horizonte', 'ISO3166-2-lvl4': 'BR-MG', country_code: 'br' });
    expect(await localDasCoordenadas({ lat: 0, lon: 0 })).toBeNull();
  });
});
