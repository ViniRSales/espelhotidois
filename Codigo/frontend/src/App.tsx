
import { Route, Routes } from 'react-router';

import RotaProtegida from '@/features/autenticacao/RotaProtegida';
import RotaVisitante from '@/features/autenticacao/RotaVisitante';
import ThemeDisplay from '@/pages/ThemeDisplay';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import Adicionar from './pages/Adicionar';
import Busca from './pages/Busca';
import CadastrarItem from './pages/CadastrarItem';
import CriarConta from './pages/CriarConta';
import EmConstrucao from './pages/EmConstrucao';
import Entrar from './pages/Entrar';
import EsqueciSenha from './pages/EsqueciSenha';
import Home from './pages/Home';
import ItemPublicado from './pages/ItemPublicado';
import Menu from './pages/Menu';
import RedefinirSenha from './pages/RedefinirSenha';
import DetalheSolicitacao from './pages/solicitacao/DetalheSolicitacao';
import EditarSolicitacao from './pages/solicitacao/EditarSolicitacao';
import NovaSolicitacao from './pages/solicitacao/NovaSolicitacao';
import PedidoPublicado from './pages/solicitacao/PedidoPublicado';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path='/' element={<Home />} />
        {/* Cadastrar itens exige login. A API também barra; isto só evita abrir uma tela que não vai funcionar. */}
        <Route element={<RotaProtegida />}>
          <Route path='/adicionar' element={<Adicionar />} />
          <Route path='/adicionar/item/:id?' element={<CadastrarItem />} />
          <Route path='/adicionar/item/:id/publicado' element={<ItemPublicado />} />
          <Route path='/adicionar/pedido' element={<NovaSolicitacao />} />
          <Route path='/adicionar/pedido/:id/publicado' element={<PedidoPublicado />} />
          <Route path='/pedidos/:id/editar' element={<EditarSolicitacao />} />
          <Route path='/menu' element={<Menu />} />
          {/* Provisórias: telas de outras issues, já ligadas à navegação do cabeçalho. */}
          <Route path='/bate-papo' element={<EmConstrucao />} />
          <Route path='/voce' element={<EmConstrucao />} />
          <Route path='/localizacao' element={<EmConstrucao />} />
          <Route path='/notificacoes' element={<EmConstrucao />} />
        </Route>
        <Route path='/buscar' element={<Busca />} />
        {/* Provisória: a página da doação é de outra task. */}
        <Route path='/doacoes/:id' element={<EmConstrucao />} />
        <Route path='/pedidos/:id' element={<DetalheSolicitacao />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route element={<RotaVisitante />}>
          <Route path='/entrar' element={<Entrar />} />
          <Route path='/criar-conta' element={<CriarConta />} />
          <Route path='/esqueci-senha' element={<EsqueciSenha />} />
        </Route>
        {/* Abre logado ou não: o link do e-mail pode ser aberto num aparelho em que a pessoa ainda está logada. */}
        <Route path='/redefinir-senha' element={<RedefinirSenha />} />
      </Route>
      <Route path='/theme' element={<ThemeDisplay />} />
    </Routes>
  );
}

export default App;
