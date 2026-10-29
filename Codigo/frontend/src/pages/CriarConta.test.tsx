import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { abrirApp, sessao } from '@/features/autenticacao/testes/dados';
import { ApiError } from '@/services/api';
import * as autenticacao from '@/services/autenticacao';
import * as localizacao from '@/services/localizacao';

vi.mock('@/services/autenticacao');
vi.mock('@/services/localizacao', async (original) => ({
    ...(await original<typeof import('@/services/localizacao')>()),
    buscarBairros: vi.fn(),
    localDasCoordenadas: vi.fn(),
}));

const servico = vi.mocked(autenticacao);
const buscarBairros = vi.mocked(localizacao.buscarBairros);
const localDasCoordenadas = vi.mocked(localizacao.localDasCoordenadas);

function simularPosicao(resultado: { lat: number; lon: number } | { negado: true }) {
    vi.stubGlobal('navigator', Object.assign(Object.create(navigator), {
        geolocation: {
            getCurrentPosition: (ok: PositionCallback, falha: PositionErrorCallback) => {
                if ('negado' in resultado) falha({ code: 1 } as GeolocationPositionError);
                else ok({ coords: { latitude: resultado.lat, longitude: resultado.lon } } as GeolocationPosition);
            },
        },
    }));
}

const SAVASSI = { bairro: 'Savassi', cidade: 'Belo Horizonte', uf: 'MG' };

async function escolherBairro(texto: string, opcao: RegExp) {
    await userEvent.type(screen.getByRole('combobox', { name: 'Bairro' }), texto);
    await userEvent.click(await screen.findByRole('option', { name: opcao }));
}

async function preencherTudo() {
    await userEvent.type(screen.getByLabelText('Nome completo'), 'Maria da Silva');
    await userEvent.type(screen.getByLabelText('E-mail'), 'maria@email.com');
    await userEvent.type(screen.getByLabelText('Telefone'), '31999998888');
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo123');
    await escolherBairro('Sava', /Savassi/);
}

describe('CriarConta', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        buscarBairros.mockResolvedValue([SAVASSI]);
    });

    it('cria a conta, entra direto e vai para a Home', async () => {
        servico.cadastrar.mockResolvedValue(sessao());
        const router = abrirApp('/criar-conta');

        await preencherTudo();
        await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

        expect(await screen.findByText('Home')).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/');
        expect(servico.cadastrar).toHaveBeenCalledWith({
            tipo: 'PESSOA_FISICA',
            nome: 'Maria da Silva',
            email: 'maria@email.com',
            telefone: '31999998888',
            bairro: 'Savassi',
            cidade: 'Belo Horizonte',
            uf: 'MG',
            senha: 'segredo123',
        });
        // Quem acabou de criar a conta fica conectado (localStorage).
        expect(localStorage.getItem('doapp.sessao')).not.toBeNull();
    });

    it('aplica a máscara no telefone enquanto a pessoa digita', async () => {
        abrirApp('/criar-conta');

        await userEvent.type(screen.getByLabelText('Telefone'), '31999998888');

        expect(screen.getByLabelText('Telefone')).toHaveValue('(31) 99999-8888');
    });

    it('instituição troca o rótulo do nome e vai no cadastro', async () => {
        servico.cadastrar.mockResolvedValue(sessao());
        abrirApp('/criar-conta');

        expect(screen.getByRole('radio', { name: 'Pessoa física' })).toBeChecked();
        await userEvent.click(screen.getByRole('radio', { name: 'Instituição' }));
        expect(screen.getByLabelText('Nome da instituição')).toBeInTheDocument();
        expect(screen.queryByLabelText('Nome completo')).not.toBeInTheDocument();

        await userEvent.type(screen.getByLabelText('Nome da instituição'), 'Bazar da Paróquia');
        await userEvent.type(screen.getByLabelText('E-mail'), 'bazar@email.com');
        await userEvent.type(screen.getByLabelText('Telefone'), '3133334444');
        await userEvent.type(screen.getByLabelText('Senha'), 'segredo123');
        buscarBairros.mockResolvedValue([{ bairro: 'Centro', cidade: 'Contagem', uf: 'MG' }]);
        await escolherBairro('Centro', /Contagem/);
        await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

        await screen.findByText('Home');
        expect(servico.cadastrar).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'INSTITUICAO', nome: 'Bazar da Paróquia' }));
    });

    it('mostra os erros de cada campo e foca o primeiro, sem chamar a API', async () => {
        abrirApp('/criar-conta');

        await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

        expect(screen.getByLabelText('Nome completo')).toHaveFocus();
        expect(screen.getByLabelText('Nome completo')).toHaveAccessibleDescription('Informe seu nome.');
        expect(screen.getByRole('combobox', { name: 'Bairro' })).toHaveAccessibleDescription(
            'Digite e escolha seu bairro na lista. Digite seu bairro e escolha uma opção da lista.',
        );
        expect(screen.getByLabelText('Senha')).toHaveAccessibleDescription(
            'Use pelo menos 8 caracteres. A senha precisa ter pelo menos 8 caracteres.',
        );
        expect(servico.cadastrar).not.toHaveBeenCalled();
    });

    it('não aceita bairro digitado sem escolher da lista', async () => {
        abrirApp('/criar-conta');

        await userEvent.type(screen.getByRole('combobox', { name: 'Bairro' }), 'Savassi');
        await userEvent.keyboard('{Escape}');
        await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

        expect(screen.getByRole('combobox', { name: 'Bairro' })).toHaveAttribute('aria-invalid', 'true');
        expect(servico.cadastrar).not.toHaveBeenCalled();
    });

    it('"Usar minha localização" preenche o bairro com cidade e UF', async () => {
        simularPosicao({ lat: -19.93, lon: -43.93 });
        localDasCoordenadas.mockResolvedValue(SAVASSI);
        abrirApp('/criar-conta');

        await userEvent.click(screen.getByRole('button', { name: 'Usar minha localização' }));

        expect(await screen.findByDisplayValue('Savassi, Belo Horizonte - MG')).toBeInTheDocument();
        expect(localDasCoordenadas).toHaveBeenCalledWith({ lat: -19.93, lon: -43.93 });
        vi.unstubAllGlobals();
    });

    it('sem permissão de localização, avisa no campo e deixa digitar', async () => {
        simularPosicao({ negado: true });
        abrirApp('/criar-conta');

        await userEvent.click(screen.getByRole('button', { name: 'Usar minha localização' }));

        expect(await screen.findByText('Sem permissão para usar sua localização. Digite seu bairro.')).toBeInTheDocument();
        expect(localDasCoordenadas).not.toHaveBeenCalled();
        vi.unstubAllGlobals();
    });

    it('não mostra mais o texto "Leva menos de 2 minutos"', () => {
        abrirApp('/criar-conta');

        expect(screen.queryByText(/Leva menos de 2 minutos/)).not.toBeInTheDocument();
    });

    it('e-mail já cadastrado mostra o erro no campo e-mail', async () => {
        servico.cadastrar.mockRejectedValue(new ApiError(409, 'Já existe uma conta com este e-mail.'));
        abrirApp('/criar-conta');

        await preencherTudo();
        await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

        const email = await screen.findByLabelText('E-mail');
        expect(email).toHaveAccessibleDescription('Já existe uma conta com este e-mail.');
        expect(email).toHaveFocus();
        expect(localStorage.getItem('doapp.sessao')).toBeNull();
    });

    it('mostra os erros de campo devolvidos pela API', async () => {
        servico.cadastrar.mockRejectedValue(new ApiError(400, 'Confira os campos', [
            { campo: 'telefone', mensagem: 'Informe o telefone com DDD.' },
        ]));
        abrirApp('/criar-conta');

        await preencherTudo();
        await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

        expect(await screen.findByLabelText('Telefone')).toHaveAccessibleDescription('Informe o telefone com DDD.');
    });

    it('sem conexão mostra o aviso geral', async () => {
        servico.cadastrar.mockRejectedValue(new ApiError(0, 'Não foi possível conectar. Confira sua internet e tente de novo.'));
        abrirApp('/criar-conta');

        await preencherTudo();
        await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar.');
    });
});
