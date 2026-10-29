# Código do projeto

Esta pasta reúne todo o código-fonte do Doapp. O projeto é organizado como um monorepo, com o front-end e o back-end separados em pastas próprias.

| Pasta | Tecnologia | Descrição |
|---|---|---|
| [`frontend`](frontend) | React | Interface web usada por doadores, receptores e instituições |
| [`backend`](backend) | Spring Boot | API REST com as regras de negócio e o acesso ao banco de dados |

O front-end se comunica com o back-end por meio de requisições HTTP à API.

## Estrutura prevista

```
Codigo/
├── frontend/
│   └── src/
│       ├── assets/       imagens e ícones
│       ├── components/   componentes reutilizáveis
│       ├── pages/        telas da aplicação
│       ├── services/     chamadas à API do back-end
│       ├── hooks/
│       ├── contexts/
│       └── routes/
└── backend/
    └── src/main/java/br/pucminas/doapp/
        ├── controller/   endpoints da API
        ├── service/      regras de negócio
        ├── repository/   acesso ao banco de dados
        ├── model/        entidades
        ├── dto/          objetos de entrada e saída da API
        ├── config/       configurações (CORS, segurança)
        └── exception/    tratamento de erros
```

## Como executar

### Pré-requisitos

| Ferramenta | Versão | Para quê |
|---|---|---|
| Java (JDK) | 25 | API Spring Boot |
| Node.js | 22 | Front-end React |
| Docker Desktop | atual | Rodar tudo junto com Docker Compose (no Windows, ative a integração com o WSL em Settings → Resources → WSL Integration) |

O Maven não precisa ser instalado: o projeto usa o Maven Wrapper (`./mvnw`).

### Tudo de uma vez com Docker Compose

Na pasta `Codigo/`:

```bash
cp .env.example .env      # opcional: só se for usar o MongoDB Atlas
docker compose up --build
```

| Serviço | Endereço |
|---|---|
| Front-end | http://localhost:5173 |
| API | http://localhost:8080 |
| MongoDB | localhost:27017 |
| E-mails (Mailpit) | http://localhost:8025 |

Sem `MONGODB_URI` no `.env`, a API usa o MongoDB que o próprio Compose sobe.

### Só a API, sem Docker

Precisa de um MongoDB rodando (local na porta 27017 ou no Atlas):

```bash
cd backend
./mvnw spring-boot:run
```

Para usar o Atlas, defina a variável antes de rodar:

```bash
export MONGODB_URI="mongodb+srv://usuario:senha@cluster.xxxxx.mongodb.net/doapp"
./mvnw spring-boot:run
```

Na primeira vez que sobe, a API cria as categorias iniciais. Para conferir:

```bash
curl http://localhost:8080/actuator/health   # {"status":"UP"}
curl http://localhost:8080/api/categorias    # lista de categorias
```

### Só o front-end, sem Docker

Com a API rodando (veja acima), em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

O site abre em http://localhost:5173. As chamadas para `/api` são encaminhadas para a API em `http://localhost:8080`, então não é preciso configurar CORS nem endereço em desenvolvimento. Scripts, estrutura de pastas e como chamar a API estão no [README do front-end](frontend/README.md).

### Testes

```bash
cd backend
./mvnw test
```

```bash
cd frontend
npm test
```

Nenhum dos dois precisa da API rodando. A exceção é o `PersistenciaMongoTest` do back-end, que confere o que cada fluxo grava num MongoDB de verdade: ele sobe o banco num contêiner com o Testcontainers e precisa do Docker aberto. Sem Docker, esse teste é pulado e os outros rodam normalmente.

### Login e chave do JWT

Para usar as telas que exigem conta (como Adicionar), crie uma conta em http://localhost:5173/criar-conta.

O login emite um token JWT assinado com a chave `JWT_SEGREDO` (pelo menos 32 caracteres):

- **Desenvolvimento:** a API sobe no perfil `dev`, que é o padrão quando `SPRING_PROFILES_ACTIVE` não é definido. Esse perfil já tem uma chave de desenvolvimento, em [`application-dev.yml`](backend/src/main/resources/application-dev.yml).
- **Produção:** use `SPRING_PROFILES_ACTIVE=prod` e defina `JWT_SEGREDO` com uma chave aleatória e secreta. Sem ela, a API não sobe. Para gerar uma chave:

  ```bash
  openssl rand -base64 48
  ```

As durações da sessão ficam no bloco `doapp.jwt` do `application.yml`: 12 horas sem "Manter conectado" e 7 dias com ele.

Trocar a senha encerra todas as sessões da conta na hora. Cada token leva a versão da sessão da conta (claim `sv`), e a troca de senha aumenta essa versão.

### Limites contra força bruta

Para ninguém ficar chutando senhas ou criando contas em massa, a API responde **429** depois de:

| Ação | Limite |
|---|---|
| Login com senha errada, na mesma conta e no mesmo IP | 5 a cada 15 minutos |
| Login com senha errada, no mesmo IP (qualquer conta) | 20 a cada 15 minutos |
| Cadastro e "Esqueci minha senha", no mesmo IP | 10 por hora |

Um login certo zera os erros da conta. Os contadores ficam na memória da API, o que basta para uma instância só.

**Em produção**, atrás de um proxy (Render, Railway, Nginx), defina `FORWARD_HEADERS_STRATEGY=native`. Sem isso, a API vê todo mundo com o IP do proxy e o limite por IP barraria todos ao mesmo tempo.

### E-mails (recuperação de senha)

O "Esqueci minha senha" envia um link por e-mail, que vale 30 minutos e uma vez só.

- **Docker Compose:** os e-mails vão para o **Mailpit**, uma caixa de entrada falsa que não entrega nada a ninguém. Veja as mensagens em http://localhost:8025.
- **API fora do Docker:** o perfil `dev` também escreve o link no log da API.
- **Produção:** configure um servidor SMTP com as variáveis abaixo. Sem `MAIL_HOST`, a API sobe e avisa no log, mas não envia e-mails.

| Variável | Uso |
|---|---|
| `MAIL_HOST`, `MAIL_PORT` | Servidor SMTP (por exemplo, `smtp-relay.brevo.com` e `587`) |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | Login do SMTP |
| `APP_URL` | Endereço do front-end, usado no link do e-mail (por exemplo, `https://doapp.com.br`) |
| `DOAPP_EMAIL_REMETENTE` | Remetente (o padrão é `Doapp <nao-responda@doapp.com.br>`) |

### Fotos das doações

As fotos ficam no disco, em `backend/uploads/fotos` (fora do Git). Para mudar a pasta, defina `DOAPP_FOTOS_DIRETORIO`. No Docker Compose elas ficam no volume `fotos-doacoes`. Os limites (quantidade, tamanho e formatos) estão no bloco `doapp.doacoes` do `application.yml`.

A foto de referência dos pedidos usa o mesmo armazenamento, numa pasta com o id do pedido, e é servida pelo mesmo `GET /api/fotos/{id}/{arquivo}`. Vale o mesmo tamanho e formatos; a quantidade (uma) está em `doapp.solicitacoes.fotos-maximo`.

## API

### Endpoints disponíveis

| Método | Caminho | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/auth/cadastro` | público | Cria a conta e já devolve a sessão (409 se o e-mail já existir) |
| POST | `/api/auth/login` | público | Devolve `{ token, expiraEm, usuario }` (401 com e-mail ou senha incorretos) |
| GET | `/api/auth/eu` | logado | Dados da própria conta |
| POST | `/api/auth/logout` | logado | Encerra o token usado na requisição |
| POST | `/api/auth/esqueci-senha` | público | Envia o link de redefinição por e-mail (sempre 204, exista ou não a conta) |
| POST | `/api/auth/redefinir-senha` | público | Troca a senha com o token do link e encerra todas as sessões da conta |
| GET | `/api/categorias` | público | Lista as categorias em ordem alfabética |
| GET | `/api/doacoes/rascunho` | logado | Rascunho de doação do usuário (204 se não houver) |
| POST | `/api/doacoes` | logado | Cria o rascunho (409 se já existir um) |
| GET | `/api/doacoes/{id}` | público* | Doação publicada; um rascunho só para quem o criou |
| PUT | `/api/doacoes/{id}` | dono | Atualiza o rascunho |
| DELETE | `/api/doacoes/{id}` | dono | Descarta o rascunho e as fotos dele |
| POST | `/api/doacoes/{id}/fotos` | dono | Envia uma foto (multipart, campo `arquivo`) |
| DELETE | `/api/doacoes/{id}/fotos/{fotoId}` | dono | Remove uma foto |
| POST | `/api/doacoes/{id}/publicar` | dono | Confere tudo e publica por 30 dias |
| GET | `/api/fotos/{doacaoId}/{arquivo}` | público | Arquivo da foto |
| POST | `/api/solicitacoes` | logado | Cadastra um pedido (obrigatórios: `titulo`, `categoriaId`, `urgencia`) |
| GET | `/api/solicitacoes/{id}` | público | Pedido, sem dados de quem pediu; `souDono` diz se é do usuário logado |
| PUT | `/api/solicitacoes/{id}` | dono | Edita um pedido aberto |
| POST | `/api/solicitacoes/{id}/cancelar` | dono | Cancela um pedido aberto (não dá para reabrir) |
| POST | `/api/solicitacoes/{id}/fotos` | dono | Envia a foto de referência opcional (multipart, campo `arquivo`; no máximo 1) |
| DELETE | `/api/solicitacoes/{id}/fotos/{fotoId}` | dono | Remove a foto de referência |
| GET | `/actuator/health` | público | Saúde da API (usado no deploy) |

A leitura (`GET /api/**`) é pública, menos `/api/auth/eu` e `/api/doacoes/rascunho`, que trazem dados de quem está logado. Criar, editar ou excluir exige login: envie o token no cabeçalho `Authorization: Bearer <token>`. Um token vencido, adulterado ou encerrado pelo logout devolve 401. Um job diário marca como `EXPIRADA` as doações cujo prazo terminou.

A urgência de um pedido é `BAIXA`, `MEDIA` ou `ALTA` (na tela: "Sem pressa", "Em breve" e "Urgente"). A resposta de um pedido nunca traz o `receptorId` nem contatos de quem pediu (RNF03). Editar ou cancelar um pedido que não está aberto devolve 409.

### Formato dos erros

Qualquer erro da API volta no mesmo formato, para o front-end mostrar a mensagem ao usuário e marcar os campos inválidos:

```json
{
  "status": 400,
  "erro": "Bad Request",
  "mensagem": "Confira os campos destacados e tente de novo.",
  "campos": [{ "campo": "titulo", "mensagem": "não deve estar em branco" }]
}
```

| Status | Quando |
|---|---|
| 400 | Dados inválidos (validação do `@Valid` ou regra do serviço) |
| 401 | Precisa estar logado |
| 403 | O usuário não é dono do documento |
| 404 | Recurso ou endereço inexistente |
| 405 | Método HTTP que o endereço não aceita |
| 409 | Conflito, como e-mail já cadastrado |
| 429 | Tentativas demais em pouco tempo (veja "Limites contra força bruta") |
| 413 | Arquivo enviado acima do tamanho permitido |
| 500 | Erro inesperado (sem detalhes técnicos na resposta) |

Para devolver esses erros a partir de um service, lance `DadosInvalidosException` (com os campos), `RecursoNaoEncontradoException`, `AcessoNegadoException`, `ConflitoException`, `ArquivoMuitoGrandeException` ou `NaoAutenticadoException` (pacote `exception`).

### Como os outros pacotes usam esta base

- **Quem está logado:** `controleAcessoService.idUsuarioAtual()` devolve o id do usuário (o `sub` do token) ou lança 401.
- **Doações, solicitações e conta (#12, #13, #14):** antes de alterar um documento, chamar `controleAcessoService.garantirDono(donoId)`. Ele devolve 401 se não houver login e 403 se o usuário não for o dono (F46).
- **Rotas novas:** um `GET` com dados pessoais precisa de uma regra `authenticated()` no `SecurityConfig`, antes da regra que deixa os `GET`s públicos. Nos `@WebMvcTest` que importam o `SecurityConfig`, adicione `@MockitoBean TokenRevogadoRepository`.
- **Categorias:** use `CategoriaService.buscar(id)` para validar a categoria de uma doação ou solicitação.
