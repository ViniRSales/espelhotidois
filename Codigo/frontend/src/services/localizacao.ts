// Geocodificação com o Nominatim (OpenStreetMap), chamado direto do navegador.
// Política de uso: no máximo 1 requisição por segundo e atribuição ao OpenStreetMap onde o mapa aparece.
// https://operations.osmfoundation.org/policies/nominatim/

const NOMINATIM = 'https://nominatim.openstreetmap.org';

export type BairroCidade = { bairro: string; cidade: string };
export type Coordenadas = { lat: number; lon: number };

type Endereco = Partial<Record<
  'suburb' | 'neighbourhood' | 'quarter' | 'city_district' | 'city' | 'town' | 'village' | 'municipality',
  string
>>;

async function consultar<T>(caminho: string, parametros: Record<string, string>): Promise<T> {
  const url = `${NOMINATIM}${caminho}?${new URLSearchParams({
    format: 'jsonv2',
    'accept-language': 'pt-BR',
    ...parametros,
  })}`;
  const resposta = await fetch(url).catch(() => null);
  if (!resposta?.ok) {
    throw new Error('Não conseguimos consultar o mapa agora.');
  }
  return resposta.json() as Promise<T>;
}

/** Bairro e cidade de um ponto (usado por "Usar minha localização atual"). */
export async function bairroDasCoordenadas({ lat, lon }: Coordenadas): Promise<BairroCidade> {
  const { address = {} } = await consultar<{ address?: Endereco }>('/reverse', {
    lat: String(lat),
    lon: String(lon),
    zoom: '14',
    addressdetails: '1',
  });
  return {
    bairro: address.suburb ?? address.neighbourhood ?? address.quarter ?? address.city_district ?? '',
    cidade: address.city ?? address.town ?? address.village ?? address.municipality ?? '',
  };
}

// Sugestões enquanto a pessoa digita: o Nominatim proíbe autocompletar, então usamos o Photon
// (também com dados do OpenStreetMap, feito para busca durante a digitação). Uso justo: a busca
// só começa com 3 letras e espera a pessoa parar de digitar.
// https://photon.komoot.io

const PHOTON = 'https://photon.komoot.io/api/';
/** Retângulo que cobre o Brasil (oeste, sul, leste, norte). */
const BRASIL = '-74,-34,-34,6';

/** Bairro escolhido na lista, já separado em bairro, cidade e sigla do estado. */
export type LocalSugerido = { bairro: string; cidade: string; uf: string };

const UFS: Record<string, string> = {
  Acre: 'AC', Alagoas: 'AL', Amapá: 'AP', Amazonas: 'AM', Bahia: 'BA', Ceará: 'CE', 'Distrito Federal': 'DF',
  'Espírito Santo': 'ES', Goiás: 'GO', Maranhão: 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG', Pará: 'PA', Paraíba: 'PB', Paraná: 'PR', Pernambuco: 'PE', Piauí: 'PI',
  'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS', Rondônia: 'RO', Roraima: 'RR',
  'Santa Catarina': 'SC', 'São Paulo': 'SP', Sergipe: 'SE', Tocantins: 'TO',
};

type FeaturePhoton = {
  properties: Partial<Record<'name' | 'city' | 'county' | 'state' | 'countrycode' | 'osm_key', string>>;
};

/** "Savassi, Belo Horizonte - MG". */
export function formatarLocal({ bairro, cidade, uf }: LocalSugerido) {
  return `${bairro}, ${cidade} - ${uf}`;
}

/** Bairros do Brasil cujo nome combina com o texto digitado, sem repetidos. */
export async function buscarBairros(texto: string, signal?: AbortSignal): Promise<LocalSugerido[]> {
  const parametros = new URLSearchParams({ q: texto, limit: '10', bbox: BRASIL });
  parametros.append('layer', 'district');
  parametros.append('layer', 'locality');
  const resposta = await fetch(`${PHOTON}?${parametros}`, { signal });
  if (!resposta.ok) throw new Error('Não conseguimos buscar os bairros agora.');
  const { features = [] } = (await resposta.json()) as { features?: FeaturePhoton[] };

  const vistos = new Set<string>();
  const sugestoes: LocalSugerido[] = [];
  for (const { properties: p } of features) {
    // Só bairros de verdade (place ou limite administrativo); ignora condomínios, ruas e afins.
    if (p.countrycode !== 'BR' || (p.osm_key !== 'place' && p.osm_key !== 'boundary')) continue;
    const cidade = p.city ?? p.county;
    const uf = p.state ? UFS[p.state] : undefined;
    if (!p.name || !cidade || !uf || p.name === cidade) continue;
    const local = { bairro: p.name, cidade, uf };
    const chave = formatarLocal(local).toLocaleLowerCase('pt-BR');
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    sugestoes.push(local);
  }
  return sugestoes.slice(0, 6);
}

type EnderecoComEstado = Endereco & { state?: string; 'ISO3166-2-lvl4'?: string; country_code?: string };

/**
 * Bairro, cidade e UF de um ponto, para o "Usar minha localização atual" do cadastro de conta. Faz o mesmo que
 * `bairroDasCoordenadas` (usada no cadastro de doação), mas também devolve o estado. `null` fora do Brasil ou
 * quando o ponto não tem bairro.
 */
export async function localDasCoordenadas({ lat, lon }: Coordenadas): Promise<LocalSugerido | null> {
  const { address = {} } = await consultar<{ address?: EnderecoComEstado }>('/reverse', {
    lat: String(lat),
    lon: String(lon),
    zoom: '14',
    addressdetails: '1',
  });
  const bairro = address.suburb ?? address.neighbourhood ?? address.quarter ?? address.city_district;
  const cidade = address.city ?? address.town ?? address.village ?? address.municipality;
  // "BR-MG" → "MG"; se não vier, tenta pelo nome do estado.
  const uf = address['ISO3166-2-lvl4']?.replace(/^BR-/, '') ?? (address.state ? UFS[address.state] : undefined);
  if (address.country_code && address.country_code !== 'br') return null;
  return bairro && cidade && uf ? { bairro, cidade, uf } : null;
}

/** Centro aproximado de um bairro, para o mapa; `null` se não for encontrado. */
export async function coordenadasDoBairro({ bairro, cidade }: BairroCidade): Promise<Coordenadas | null> {
  const resultados = await consultar<{ lat: string; lon: string }[]>('/search', {
    q: `${bairro}, ${cidade}`,
    countrycodes: 'br',
    limit: '1',
  });
  const [primeiro] = resultados;
  return primeiro ? { lat: Number(primeiro.lat), lon: Number(primeiro.lon) } : null;
}
