import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { aoExpirarSessao, ApiError, definirToken } from '@/services/api';
import * as servico from '@/services/autenticacao';
import type { DadosCadastro, DadosLogin, Sessao, Usuario } from '@/types/autenticacao';

import { AutenticacaoContext, type Autenticacao, type SituacaoSessao } from './contexto';
import { apagarSessaoSalva, lerSessaoSalva, salvarSessao, type SessaoSalva } from './sessaoSalva';

type Estado = { situacao: SituacaoSessao; usuario: Usuario | null; saiu: boolean };

const VISITANTE: Estado = { situacao: 'visitante', usuario: null, saiu: false };

function AutenticacaoProvider({ children }: { children: ReactNode }) {
    const [sessaoInicial] = useState<SessaoSalva | null>(() => lerSessaoSalva());
    const [estado, setEstado] = useState<Estado>(() =>
        sessaoInicial ? { situacao: 'verificando', usuario: null, saiu: false } : VISITANTE,
    );

    const encerrarLocal = useCallback((saiu = false) => {
        apagarSessaoSalva();
        definirToken(null);
        setEstado({ ...VISITANTE, saiu });
    }, []);

    useEffect(() => aoExpirarSessao(() => encerrarLocal()), [encerrarLocal]);

    useEffect(() => {
        if (!sessaoInicial) return;
        let ativo = true;
        definirToken(sessaoInicial.token);
        servico.buscarUsuarioAtual()
            .then((usuario) => {
                if (ativo) setEstado({ situacao: 'logado', usuario, saiu: false });
            })
            .catch((erro: unknown) => {
                if (!ativo) return;
                if (!(erro instanceof ApiError && erro.status === 401)) {
                    definirToken(null);
                    setEstado(VISITANTE);
                }
            });
        return () => {
            ativo = false;
        };
    }, [sessaoInicial]);

    const iniciar = useCallback((sessao: Sessao, manterConectado: boolean) => {
        salvarSessao({ token: sessao.token, expiraEm: sessao.expiraEm }, manterConectado);
        definirToken(sessao.token);
        setEstado({ situacao: 'logado', usuario: sessao.usuario, saiu: false });
    }, []);

    const entrar = useCallback(async (dados: DadosLogin) => {
        iniciar(await servico.entrar(dados), dados.manterConectado);
    }, [iniciar]);

    const cadastrar = useCallback(async (dados: DadosCadastro) => {
        iniciar(await servico.cadastrar(dados), true);
    }, [iniciar]);

    const sair = useCallback(async () => {
        await servico.sair().catch(() => undefined);
        encerrarLocal(true);
    }, [encerrarLocal]);

    const valor = useMemo<Autenticacao>(
        () => ({ ...estado, entrar, cadastrar, sair }),
        [estado, entrar, cadastrar, sair],
    );

    return <AutenticacaoContext value={valor}>{children}</AutenticacaoContext>;
}

export default AutenticacaoProvider;
