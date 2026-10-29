# Padrão de Commits

O Doapp adota o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/) (commits semânticos). Ele mantém o histórico legível e facilita rastrear mudanças no monorepo (frontend + backend).

## Formato

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

- Escreva a descrição em português, no imperativo ou infinitivo, em minúsculas, sem ponto final.
- Mantenha a primeira linha com até 72 caracteres.
- O escopo é opcional, mas recomendado.

## Tipos

| Tipo       | Quando usar                                                      |
| ---------- | ---------------------------------------------------------------- |
| `feat`     | Nova funcionalidade                                              |
| `fix`      | Correção de bug                                                  |
| `docs`     | Alterações apenas em documentação                                |
| `style`    | Formatação que não altera a lógica (espaços, ponto e vírgula)    |
| `refactor` | Mudança de código que não corrige bug nem adiciona funcionalidade |
| `perf`     | Melhoria de desempenho                                           |
| `test`     | Adição ou ajuste de testes                                       |
| `build`    | Mudanças no build ou dependências (npm, Maven, Gradle)           |
| `ci`       | Mudanças em pipelines e workflows (GitHub Actions)               |
| `chore`    | Tarefas de manutenção que não alteram código de produção         |
| `revert`   | Reverte um commit anterior                                       |

## Escopos sugeridos

| Escopo      | Área                                   |
| ----------- | -------------------------------------- |
| `frontend`  | App React + Vite (`Codigo/frontend`) |
| `backend`   | API Java Spring Boot (`Codigo/backend`)   |
| `artefatos` | Personas, requisitos, proposta de valor |
| `docs`      | Documentação do projeto                |
| `repo`      | Configuração do repositório (`.gitignore`, templates) |

Para telas ou módulos específicos, use escopos mais finos, como `feat(frontend/login)` ou `fix(backend/doacao)`.

## Exemplos

```
feat(frontend): adiciona tela de listagem de doações
fix(backend): corrige validação de CPF no cadastro de doador
docs(artefatos): atualiza requisitos funcionais
refactor(frontend): extrai componente de cartão de doação
build(backend): atualiza Spring Boot para a versão 3.4
chore(repo): adiciona regras de Java ao .gitignore
ci: adiciona workflow de lint para o frontend
```

## Mudanças que quebram compatibilidade

Adicione `!` após o tipo/escopo e descreva o impacto no rodapé com `BREAKING CHANGE:`.

```
feat(backend)!: altera formato de resposta da API de doações

BREAKING CHANGE: o campo `valor` agora retorna um objeto com `quantia` e `moeda`.
```

## Referenciando tarefas

Use o rodapé para vincular issues:

```
fix(frontend): corrige crash ao abrir o mapa

Closes #12
```

## Boas práticas

- Um commit deve representar uma mudança lógica única.
- Evite commits que misturem frontend e backend; separe-os.
- Não use mensagens genéricas como `ajustes`, `update` ou `fix`.
- Use o corpo do commit para explicar o **porquê**, não o **como**.
