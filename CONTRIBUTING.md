# Como contribuir

Este guia explica como o grupo trabalha com Git no Doapp: como criar branches, como abrir Pull Requests e o passo a passo do dia a dia. O padrão das mensagens de commit está no [COMMITS.md](COMMITS.md).

## Modelo de branches

A branch principal é a `main`. Ninguém faz commit direto nela: todo código entra por Pull Request (PR).

Trabalhamos com **uma branch por tarefa**, e não uma por pessoa. Cada tarefa é uma issue do [quadro do projeto](https://github.com/orgs/ICEI-PUC-Minas-PPLES-TI/projects/905), e cada branch nasce da `main`, resolve uma issue e volta para a `main` por um PR.

Por que por tarefa:

- cada PR fecha uma issue, então dá para ver no histórico quem fez o quê e por quê;
- os PRs ficam menores e mais fáceis de revisar;
- se duas pessoas precisarem trabalhar na mesma tarefa, usam a mesma branch;
- quando a tarefa termina, a branch é apagada e não fica nada parado.

## Nome da branch

```
<tipo>/<número-da-issue>-<descrição-curta>
```

| Tipo | Quando usar |
|---|---|
| `feature` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Só documentação |
| `refactor` | Melhoria de código sem mudar comportamento |
| `chore` | Configuração, dependências, manutenção |

Use letras minúsculas, sem acento, com palavras separadas por hífen. Exemplos:

```
feature/10-base-tecnica
feature/11-autenticacao
feature/13-doacoes
fix/27-filtro-por-cidade
docs/3-modelo-de-dados
```

## Passo a passo

### 1. Pegue a tarefa

No quadro, abra a issue, confira se você é o responsável (Assignees) e mova o card para **Em andamento**.

### 2. Atualize a `main` e crie a branch

```bash
git switch main
git pull
git switch -c feature/13-doacoes
```

### 3. Faça commits pequenos

Um commit por mudança lógica (uma tela, um endpoint, um componente), seguindo o [COMMITS.md](COMMITS.md):

```bash
git add Codigo/backend/src/main/java/br/pucminas/doapp/controller/DoacaoController.java
git commit -m "feat(backend): adiciona endpoint de cadastro de doação"
```

Os commits têm que ser feitos por você, na sua conta: é por eles que a contribuição individual é avaliada.

### Final de linha

O projeto usa **LF** como final de linha em todos os arquivos, e o `.gitattributes` garante isso no commit. No Windows, deixe o editor salvar em LF (no VS Code: `"files.eol": "\n"`) e evite converter arquivos para CRLF: senão o arquivo inteiro aparece como alterado no PR e vai parar no seu nome no histórico, mesmo sem mudar o conteúdo.

Para conferir se um PR mudou só o final de linha de algum arquivo: `git diff --ignore-cr-at-eol --stat origin/main...`.

### 4. Mantenha a branch atualizada com a `main`

Faça isso antes de abrir o PR e sempre que alguém tiver feito merge de algo que você usa:

```bash
git fetch origin
git rebase origin/main
```

Se aparecer conflito, resolva os arquivos, rode `git add <arquivo>` e depois `git rebase --continue`.

### 5. Envie a branch

```bash
git push -u origin feature/13-doacoes
```

Depois do primeiro push, basta `git push`. Se você fez rebase depois de já ter enviado, use `git push --force-with-lease`.

### 6. Abra o Pull Request

No GitHub, abra o PR da sua branch para a `main`:

- título no padrão dos commits, por exemplo `feat(backend): cadastro de doações`;
- na descrição, o que foi feito, como testar e `Closes #13` (o número da issue), para a issue fechar sozinha no merge;
- marque pelo menos um colega como revisor;
- mova o card para **Em revisão**.

Pelo terminal, com o GitHub CLI:

```bash
gh pr create --base main --title "feat(backend): cadastro de doações" --body "Closes #13"
```

### 7. Revisão

Pelo menos uma pessoa do grupo revisa e aprova. Se pedirem mudança, faça novos commits na mesma branch e dê `git push`: o PR atualiza sozinho.

### 8. Merge e limpeza

Com o PR aprovado, faça o merge pelo GitHub. Depois, apague a branch e atualize sua `main`:

```bash
git switch main
git pull
git branch -d feature/13-doacoes
```

O card vai sozinho para **Concluído** quando a issue fecha.

## Quem ainda tem a branch `master`

A branch principal foi renomeada de `master` para `main`. Se você clonou o repositório antes disso, rode uma vez:

```bash
git branch -m master main
git fetch origin
git branch -u origin/main main
git remote set-head origin -a
```

## Resumo rápido

```bash
git switch main && git pull                  # atualiza a main
git switch -c feature/<issue>-<descricao>    # cria a branch da tarefa
git add <arquivos> && git commit -m "..."    # commits pequenos
git fetch origin && git rebase origin/main   # atualiza com a main
git push -u origin feature/<issue>-<descricao>
gh pr create --base main                     # abre o PR com "Closes #<issue>"
```
