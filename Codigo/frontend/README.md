# Front-end do Doapp

Aplicação web do Doapp, feita com React 19, TypeScript, Vite e Tailwind CSS 4.

## Como rodar

Pré-requisito: Node.js 22.

```bash
npm ci
npm run dev
```

O site abre em http://localhost:5173. As chamadas para `/api` são encaminhadas para a API Spring Boot em `http://localhost:8080`, então suba a API antes (veja o [README da pasta Codigo](../README.md)). Sem a API, a página mostra uma mensagem de erro no lugar dos dados.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm run build` | Confere os tipos e gera a versão de produção em `dist/` |
| `npm run lint` | Verifica o código com o ESLint |
| `npm test` | Roda os testes (Vitest + Testing Library) e fica observando mudanças; `npx vitest run` roda uma vez só |
| `npm run preview` | Serve localmente a versão gerada pelo build |

## Estrutura

```
src/
├── main.tsx              ponto de entrada (roteador de dados do React Router)
├── App.tsx               rotas
├── global.css            Tailwind, tokens do tema e escala de texto
├── components/           componentes reutilizáveis (botões, campos, cartões, diálogo, etapas…)
├── features/
│   ├── cadastro-doacao/  assistente de cadastro de doação: estado, validação, etapas e aviso de saída
│   └── solicitacao/      assistente de pedido (cadastro e edição), cartão, selo de urgência e cancelamento
├── pages/                telas ligadas às rotas
├── layouts/              moldura das páginas (cabeçalho)
├── services/             chamadas à API e a serviços externos
├── hooks/                hooks compartilhados (categorias, geolocalização)
├── types/                tipos dos dados da API
├── config/               limites e regras (espelham o application.yml da API)
├── theme/                temas e tokens de cor
├── utils/                funções auxiliares (datas)
└── test/                 preparação dos testes
```

## Rotas

| Rota | Tela |
|---|---|
| `/adicionar` | Escolha entre cadastrar um item ou um pedido |
| `/adicionar/item` | Cadastro de item em 5 etapas; oferece continuar o rascunho existente |
| `/adicionar/item/:id?etapa=N` | Cadastro do rascunho `id`, na etapa `N` |
| `/adicionar/item/:id/publicado` | Confirmação depois de publicar |
| `/doacoes/:id` | Provisória, até a página da doação existir |
| `/adicionar/pedido` | Cadastro de pedido em 3 etapas (só título, categoria e urgência são obrigatórios) |
| `/adicionar/pedido/:id/publicado` | Confirmação depois de publicar o pedido |
| `/pedidos/:id` | Detalhe do pedido; o dono vê editar e cancelar, com as ações fixas no rodapé no celular |
| `/pedidos/:id/editar` | Edição de um pedido aberto, só para o dono |
| `/buscar?q=` | Resultado da busca do cabeçalho (provisório, até a busca na API existir) |
| `/menu` | Menu da conta, com "Sair" |
| `/bate-papo`, `/voce`, `/localizacao`, `/notificacoes` | Provisórias, já ligadas à navegação do cabeçalho |

### Cabeçalho e navegação

O `AppHeader` segue o "Header desktop" do Figma, com os ícones do [Lucide](https://lucide.dev/icons/):

- **Visitantes:** só o logo e a busca. O convite para entrar fica no cartão da Home.
- **Quem entrou, a partir de 1024 px:** logo, busca, navegação (Início, Bate-papo, Adicionar, Você, Menu) e os atalhos de localização e notificações.
- **Quem entrou, abaixo de 1024 px:** a navegação vai para uma barra fixa embaixo da tela (`NavegacaoInferior`), como no wireframe mobile, e o logo some abaixo de 640 px.
- **Itens da navegação:** ficam em `components/AppHeader/navegacao.ts`.
- **"Pular para o conteúdo":** o link aparece ao apertar Tab no começo da página.

Sair do cadastro com um rascunho (Cancelar, menu, voltar do navegador) pergunta se ele deve ser descartado. Isso usa o `useBlocker`, que só funciona com o roteador de dados criado em `main.tsx`.

## Serviços externos

O campo de bairro do cadastro de conta sugere bairros enquanto a pessoa digita usando o [Photon](https://photon.komoot.io), também com dados do OpenStreetMap (o Nominatim não permite autocompletar). Sem acesso a ele, o campo avisa e não deixa concluir o cadastro. O botão "Usar minha localização" do mesmo campo faz como a etapa de localização da doação: pede a posição ao navegador e pergunta o bairro ao Nominatim (`localDasCoordenadas`, que também traz a UF). A posição exata não é guardada nem enviada à API.

A etapa de localização usa o [Nominatim](https://nominatim.org/) para converter a localização atual em bairro e cidade e achar o bairro no mapa, e os mapas do [OpenStreetMap](https://www.openstreetmap.org/) com o Leaflet. O Nominatim aceita no máximo uma consulta por segundo, por isso a busca espera a pessoa parar de digitar. Sem acesso a eles, o cadastro continua funcionando; só o mapa e o preenchimento automático ficam indisponíveis.

Use o alias `@/` para importar a partir de `src/`, por exemplo `import { api } from '@/services/api'`.

## Falando com a API

Toda chamada à API passa pela função `api` de `src/services/api.ts`:

```ts
import { api, ApiError } from '@/services/api';

try {
  const doacao = await api<Doacao>('/doacoes', { method: 'POST', body: dados });
} catch (e) {
  if (e instanceof ApiError) {
    e.message;                  // mensagem para mostrar ao usuário
    e.erroDoCampo('titulo');    // mensagem de um campo específico, para mostrar junto ao input
  }
}
```

- O corpo é enviado como JSON e a resposta já volta convertida. Um `FormData` (envio de arquivos) vai como está.
- Erros da API viram `ApiError` com a mensagem e os campos inválidos, no formato padronizado do back-end.
- O token de login vai sozinho no cabeçalho `Authorization` de toda chamada. Quem cuida disso é o `AutenticacaoProvider` (`src/features/autenticacao`). Um 401 com token encerra a sessão.

## Login e rotas protegidas

- Use `useAutenticacao()` para saber quem está logado (`situacao`, `usuario`) e para chamar `entrar`, `cadastrar` e `sair`.
- Telas que exigem conta ficam dentro de `<Route element={<RotaProtegida />}>` no `App.tsx`. Quem não está logado vai para `/entrar` e volta depois. A API também barra; a rota protegida só evita abrir uma tela que não vai funcionar.
- Testes que renderizam uma rota protegida precisam do `AutenticacaoProvider`. Veja `abrirApp` em `src/features/autenticacao/testes/dados.tsx`.

## Variáveis de ambiente

| Variável | Uso |
|---|---|
| `VITE_API_URL` | Endereço da API em produção (ex.: `https://api.doapp.com`). Em desenvolvimento fica vazia e o proxy do Vite cuida disso. |
| `VITE_API_PROXY` | Destino do proxy `/api` no servidor de desenvolvimento. Padrão `http://localhost:8080`; no Docker Compose aponta para o serviço `backend`. |
