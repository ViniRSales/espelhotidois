import { Navigate, Outlet, useLocation } from 'react-router';

import type { EstadoRedirecionamento } from './destino';
import { useAutenticacao } from './useAutenticacao';
import VerificandoSessao from './VerificandoSessao';

/**
 * Rotas que exigem login. Quem não está logado vai para `/entrar` e volta para cá depois.
 * É só experiência de uso: quem protege os dados de verdade é a API.
 */
function RotaProtegida() {
    const { situacao, saiu } = useAutenticacao();
    const location = useLocation();

    if (situacao === 'verificando') return <VerificandoSessao />;
    // Quem acabou de clicar em "Sair" não quer ver o login de novo.
    if (situacao === 'visitante' && saiu) return <Navigate to='/' replace />;
    if (situacao === 'visitante') {
        const estado: EstadoRedirecionamento = { de: location.pathname + location.search };
        return <Navigate to='/entrar' replace state={estado} />;
    }
    return <Outlet />;
}

export default RotaProtegida;
