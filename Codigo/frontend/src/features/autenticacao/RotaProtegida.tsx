import { Navigate, Outlet, useLocation } from 'react-router';

import type { EstadoRedirecionamento } from './destino';
import { useAutenticacao } from './useAutenticacao';
import VerificandoSessao from './VerificandoSessao';

function RotaProtegida() {
    const { situacao, saiu } = useAutenticacao();
    const location = useLocation();

    if (situacao === 'verificando') return <VerificandoSessao />;
    if (situacao === 'visitante' && saiu) return <Navigate to='/' replace />;
    if (situacao === 'visitante') {
        const estado: EstadoRedirecionamento = { de: location.pathname + location.search };
        return <Navigate to='/entrar' replace state={estado} />;
    }
    return <Outlet />;
}

export default RotaProtegida;
