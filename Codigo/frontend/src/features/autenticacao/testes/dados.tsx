// Dados e montagem comuns aos testes da autenticação.
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider, type InitialEntry } from 'react-router';

import AuthLayout from '@/layouts/AuthLayout';
import CriarConta from '@/pages/CriarConta';
import Entrar from '@/pages/Entrar';
import EsqueciSenha from '@/pages/EsqueciSenha';
import RedefinirSenha from '@/pages/RedefinirSenha';
import type { Sessao, Usuario } from '@/types/autenticacao';

import AutenticacaoProvider from '../AutenticacaoProvider';
import RotaProtegida from '../RotaProtegida';
import RotaVisitante from '../RotaVisitante';

export function usuario(campos: Partial<Usuario> = {}): Usuario {
    return {
        id: 'u1',
        tipo: 'PESSOA_FISICA',
        nome: 'Maria da Silva',
        email: 'maria@email.com',
        telefone: '31999998888',
        localizacao: { bairro: 'Savassi', cidade: 'Belo Horizonte', uf: 'MG' },
        ...campos,
    };
}

export function sessao(campos: Partial<Sessao> = {}): Sessao {
    return { token: 'token-1', expiraEm: '2099-01-01T00:00:00Z', usuario: usuario(), ...campos };
}

/**
 * Monta as rotas como no App: Home pública, /adicionar protegida, entrar e criar conta só para visitantes.
 * `extra` é renderizado junto, dentro do provider (para acessar o contexto no teste).
 */
export function abrirApp(entrada: InitialEntry = '/', extra?: ReactNode) {
    const router = createMemoryRouter(
        [
            { path: '/', element: <p>Home</p> },
            { element: <RotaProtegida />, children: [{ path: '/adicionar', element: <p>Tela Adicionar</p> }] },
            {
                element: <AuthLayout />,
                children: [
                    {
                        element: <RotaVisitante />,
                        children: [
                            { path: '/entrar', element: <Entrar /> },
                            { path: '/criar-conta', element: <CriarConta /> },
                            { path: '/esqueci-senha', element: <EsqueciSenha /> },
                        ],
                    },
                    { path: '/redefinir-senha', element: <RedefinirSenha /> },
                ],
            },
        ],
        { initialEntries: [entrada] },
    );
    render(
        <AutenticacaoProvider>
            <RouterProvider router={router} />
            {extra}
        </AutenticacaoProvider>,
    );
    return router;
}
