import { Navigate, Outlet, useLocation } from 'react-router';

import { destinoAposLogin } from './destino';
import { useAutenticacao } from './useAutenticacao';
import VerificandoSessao from './VerificandoSessao';

/**
 * Rotas só para quem não está logado (entrar, criar conta). Assim que a pessoa entra,
 * vai para a Home ou de volta à tela protegida que tentou abrir.
 */
function RotaVisitante() {
    const { situacao } = useAutenticacao();
    const location = useLocation();

    if (situacao === 'verificando') return <VerificandoSessao />;
    if (situacao === 'logado') return <Navigate to={destinoAposLogin(location.state)} replace />;
    return <Outlet />;
}

export default RotaVisitante;
