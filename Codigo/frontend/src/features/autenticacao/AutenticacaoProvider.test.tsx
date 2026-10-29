import { act, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api, ApiError } from '@/services/api';
import * as autenticacao from '@/services/autenticacao';

import { lerSessaoSalva, salvarSessao } from './sessaoSalva';
import { abrirApp, usuario } from './testes/dados';
import { useAutenticacao } from './useAutenticacao';

vi.mock('@/services/autenticacao');

const servico = vi.mocked(autenticacao);
const fetchMock = vi.fn<typeof fetch>();

describe('AutenticacaoProvider e rotas', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.stubGlobal('fetch', fetchMock);
    });

    it('sem login, uma tela protegida leva ao login e guarda para onde voltar', async () => {
        const router = abrirApp('/adicionar');

        expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/entrar');
        expect(router.state.location.state).toEqual({ de: '/adicionar' });
        expect(screen.getByText('Entre na sua conta para continuar.')).toBeInTheDocument();
        expect(servico.buscarUsuarioAtual).not.toHaveBeenCalled();
    });

    it('com token salvo, confirma com a API antes de liberar a tela protegida', async () => {
        salvarSessao({ token: 't1', expiraEm: '2099-01-01T00:00:00Z' }, true);
        let confirmar!: (u: ReturnType<typeof usuario>) => void;
        servico.buscarUsuarioAtual.mockReturnValue(new Promise((resolve) => { confirmar = resolve; }));
        abrirApp('/adicionar');

        // Enquanto confere, não redireciona para o login.
        expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
        confirmar(usuario());

        expect(await screen.findByText('Tela Adicionar')).toBeInTheDocument();
    });

    it('envia o token salvo nas chamadas da API', async () => {
        salvarSessao({ token: 't1', expiraEm: '2099-01-01T00:00:00Z' }, true);
        servico.buscarUsuarioAtual.mockResolvedValue(usuario());
        abrirApp('/adicionar');
        await screen.findByText('Tela Adicionar');
        fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));

        await api('/doacoes/rascunho');

        expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Bearer t1' });
    });

    it('token recusado pela API (401) encerra a sessão e apaga o token salvo', async () => {
        salvarSessao({ token: 't1', expiraEm: '2099-01-01T00:00:00Z' }, true);
        servico.buscarUsuarioAtual.mockResolvedValue(usuario());
        const router = abrirApp('/adicionar');
        await screen.findByText('Tela Adicionar');
        fetchMock.mockResolvedValue(new Response(JSON.stringify({ mensagem: 'Sua sessão expirou.' }), { status: 401 }));

        await api('/doacoes/rascunho').catch(() => {});

        await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'));
        expect(lerSessaoSalva()).toBeNull();
    });

    it('sem conexão ao conferir o token, segue como visitante sem apagar o token', async () => {
        salvarSessao({ token: 't1', expiraEm: '2099-01-01T00:00:00Z' }, true);
        servico.buscarUsuarioAtual.mockRejectedValue(new ApiError(0, 'Sem conexão'));
        abrirApp('/adicionar');

        expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
        expect(lerSessaoSalva()).not.toBeNull();
    });

    it('clicar em "Sair" numa tela protegida leva à Home, não ao login', async () => {
        salvarSessao({ token: 't1', expiraEm: '2099-01-01T00:00:00Z' }, true);
        servico.buscarUsuarioAtual.mockResolvedValue(usuario());
        servico.sair.mockResolvedValue(undefined);
        let sair!: () => Promise<void>;
        function BotaoSair() {
            sair = useAutenticacao().sair;
            return null;
        }
        const router = abrirApp('/adicionar', <BotaoSair />);
        await screen.findByText('Tela Adicionar');

        await act(() => sair());

        expect(await screen.findByText('Home')).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/');
    });

    it('quem já está logado não vê o login: vai para a Home', async () => {
        salvarSessao({ token: 't1', expiraEm: '2099-01-01T00:00:00Z' }, false);
        servico.buscarUsuarioAtual.mockResolvedValue(usuario());
        const router = abrirApp('/entrar');

        expect(await screen.findByText('Home')).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/');
    });
});
