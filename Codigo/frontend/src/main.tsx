import '@fontsource-variable/inter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import App from './App.tsx';
import AutenticacaoProvider from './features/autenticacao/AutenticacaoProvider.tsx';
import './global.css';
import { ThemeProvider } from './theme/ThemeProvider.tsx';

// Roteador de dados: necessário para o useBlocker (aviso ao sair do cadastro). As rotas continuam em JSX no App.
const router = createBrowserRouter([{ path: '*', element: <App /> }]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AutenticacaoProvider>
        <RouterProvider router={router} />
      </AutenticacaoProvider>
    </ThemeProvider>
  </StrictMode>,
);
