import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as localizacao from '@/services/localizacao';

import CadastroDoacaoProvider from '../CadastroDoacaoProvider';
import { ALIMENTOS, doacao, foto, ROUPAS } from '../testes/dados';
import { useCadastroDoacao } from '../useCadastroDoacao';
import EtapaLocalizacao from './EtapaLocalizacao';

vi.mock('@/services/doacoes');
vi.mock('@/services/localizacao');
vi.mock('@/hooks/useCategorias', () => ({
    useCategorias: () => ({ categorias: [ROUPAS, ALIMENTOS], carregando: false, erro: null }),
}));
// O Leaflet não roda no jsdom; aqui basta saber que o mapa foi pedido e com qual centro.
vi.mock('../MapaAproximado', () => ({
    default: ({ centro, bairro }: { centro: { lat: number; lon: number }; bairro: string }) => (
        <p>Mapa de {bairro} em {centro.lat},{centro.lon}</p>
    ),
}));

const servico = vi.mocked(localizacao);

function Avancar() {
    const { continuar } = useCadastroDoacao();
    return <button type='button' onClick={() => void continuar()}>Continuar</button>;
}

/** Rascunho com as etapas 1 a 3 preenchidas: sem localização, o assistente abre na etapa 4. */
function montar(local?: { bairro: string; cidade: string }) {
    const rascunho = doacao({
        titulo: 'Cachecol', descricao: 'De lã', fotos: [foto('f1')], categoria: ROUPAS,
        condicao: 'BOM', formasEntrega: ['A_COMBINAR'], localizacao: local ?? null,
    });
    render(
        <CadastroDoacaoProvider rascunho={rascunho}>
            <EtapaLocalizacao />
            <Avancar />
        </CadastroDoacaoProvider>,
    );
}

function simularGeolocalizacao(getCurrentPosition: Geolocation['getCurrentPosition']) {
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition } });
}

describe('EtapaLocalizacao', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        servico.coordenadasDoBairro.mockResolvedValue({ lat: -19.9, lon: -43.9 });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('preenche bairro e cidade com a localização atual', async () => {
        simularGeolocalizacao((sucesso) => sucesso({ coords: { latitude: -19.91, longitude: -43.93 } } as GeolocationPosition));
        servico.bairroDasCoordenadas.mockResolvedValue({ bairro: 'Ipiranga', cidade: 'Belo Horizonte' });
        montar();

        await userEvent.click(screen.getByRole('button', { name: 'Usar minha localização atual' }));

        expect(await screen.findByDisplayValue('Ipiranga')).toBeInTheDocument();
        expect(screen.getByLabelText('Cidade')).toHaveValue('Belo Horizonte');
        expect(servico.bairroDasCoordenadas).toHaveBeenCalledWith({ lat: -19.91, lon: -43.93 });
    });

    it('sem permissão, avisa e deixa digitar', async () => {
        simularGeolocalizacao((_sucesso, erro) => erro?.({ code: 1 } as GeolocationPositionError));
        montar();

        await userEvent.click(screen.getByRole('button', { name: 'Usar minha localização atual' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Sem permissão para usar sua localização.');
        expect(screen.getByLabelText('Bairro')).toBeEnabled();
    });

    it('mostra o mapa do bairro informado', async () => {
        montar({ bairro: 'Ipiranga', cidade: 'Belo Horizonte' });

        expect(screen.getByText('Procurando o bairro no mapa…')).toBeInTheDocument();
        expect(await screen.findByText('Mapa de Ipiranga em -19.9,-43.9', {}, { timeout: 2000 })).toBeInTheDocument();
        expect(servico.coordenadasDoBairro).toHaveBeenCalledWith({ bairro: 'Ipiranga', cidade: 'Belo Horizonte' });
    });

    it('bairro não encontrado não impede o cadastro', async () => {
        servico.coordenadasDoBairro.mockResolvedValue(null);
        montar({ bairro: 'Bairro inventado', cidade: 'Lugar nenhum' });

        expect(await screen.findByText(/Não achamos esse bairro no mapa/, {}, { timeout: 2000 })).toBeInTheDocument();
    });

    it('exige bairro e cidade ao avançar', async () => {
        montar();

        await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

        expect(screen.getByLabelText('Bairro')).toHaveAccessibleDescription('Informe o bairro.');
        expect(screen.getByLabelText('Cidade')).toHaveAccessibleDescription('Informe a cidade.');
    });
});
