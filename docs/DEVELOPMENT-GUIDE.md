# Guia de Desenvolvimento - API de Solicitacoes de Viagem

Este documento transforma o enunciado da segunda avaliacao de Programacao Backend em um plano executavel. O arquivo `docs/pbak-aval2.pdf` continua sendo a fonte oficial dos requisitos. Em caso de divergencia, o PDF prevalece.

## 1. Regras de trabalho

- [x] Ler integralmente o enunciado da avaliacao.
- [x] Definir a stack e a arquitetura inicial.
- [x] Criar o guia de desenvolvimento e acompanhamento.
- [ ] Implementar uma fase por vez, respeitando a ordem deste documento.
- [ ] Executar as verificacoes da fase antes de marca-la como concluida.
- [ ] Atualizar as caixas deste documento ao concluir cada entrega.
- [ ] Criar um commit relevante ao final de cada entrega.
- [ ] Enviar cada commit para o repositorio remoto com `git push`.
- [ ] Nao agrupar todo o desenvolvimento em um unico commit final.
- [ ] Manter codigo, identificadores, testes, logs, erros e commits em ingles.

Uma caixa somente deve ser marcada quando a implementacao estiver concluida e verificada. Codigo incompleto ou sem teste nao conta como entrega concluida.

## 2. Stack definida

- [x] Runtime: Node.js 20 ou superior.
- [x] Linguagem: TypeScript com `strict: true`.
- [x] Framework HTTP: Fastify.
- [x] Banco de dados: PostgreSQL 16 executado via Docker Compose.
- [x] Acesso ao banco: `pg`, com SQL explicito.
- [x] Validacao: Zod.
- [x] Testes: Vitest e `fastify.inject()`.
- [x] Cliente HTTP externo: `fetch` nativo do Node.js.
- [x] Gerenciador de pacotes: npm.
- [x] Qualidade de codigo: ESLint e Prettier.

## 3. Arquitetura planejada

```text
src/
  config/
  database/
  errors/
  http/
    routes/
    schemas/
  integrations/
  repositories/
  services/
  app.ts
  server.ts
scripts/
  init-db.ts
tests/
```

Responsabilidades:

- `config`: leitura e validacao das variaveis de ambiente.
- `database`: conexao, schema SQL e utilitarios do PostgreSQL.
- `errors`: erros da aplicacao e tratamento centralizado.
- `http/routes`: definicao dos endpoints HTTP.
- `http/schemas`: validacao dos corpos e parametros.
- `integrations`: cliente isolado da BrasilAPI.
- `repositories`: persistencia e consultas SQL.
- `services`: regras de negocio e orquestracao dos casos de uso.
- `app.ts`: construcao da aplicacao sem abrir porta, permitindo testes.
- `server.ts`: inicializacao do servidor HTTP.
- `scripts/init-db.ts`: criacao e populacao idempotente do banco.

## 4. Contrato obrigatorio

### 4.1 Recurso `trip-requests`

Cada solicitacao deve conter:

- [ ] `id`: UUID unico.
- [ ] `requesterName`: nome do solicitante.
- [ ] `origin`: cidade de origem.
- [ ] `destination`: cidade de destino.
- [ ] `departureAt`: data e hora de saida.
- [ ] `returnAt`: data e hora de retorno.
- [ ] `purpose`: finalidade da viagem.
- [ ] `passengerCount`: quantidade de passageiros.
- [ ] `status`: `pending` ou `canceled`.
- [ ] `createdAt`: data e hora de criacao.

Datas devem ser recebidas, persistidas e retornadas como ISO 8601 completo em UTC:

```text
YYYY-MM-DDTHH:mm:ss.sssZ
```

### 4.2 Endpoints

- [ ] `POST /trip-requests`: criar uma solicitacao.
- [ ] `GET /trip-requests`: listar todas as solicitacoes.
- [ ] `GET /trip-requests/:id`: consultar uma solicitacao.
- [ ] `PATCH /trip-requests/:id/cancel`: cancelar uma solicitacao.
- [ ] `GET /holidays/:year`: consultar feriados nacionais.

### 4.3 Respostas

Sucesso:

```json
{
  "success": true,
  "data": {}
}
```

Erro:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "A clear and objective error message"
  }
}
```

- [ ] Toda resposta de sucesso segue o envelope obrigatorio.
- [ ] Toda resposta de erro segue o envelope obrigatorio.
- [ ] Mensagens de erro estao em ingles.
- [ ] Nenhuma resposta expoe stack trace, SQL ou detalhes internos.

### 4.4 Erros e status HTTP

- [ ] `VALIDATION_ERROR`: `400 Bad Request`.
- [ ] `TRIP_REQUEST_NOT_FOUND`: `404 Not Found`.
- [ ] `TRIP_REQUEST_ALREADY_CANCELED`: `409 Conflict`.
- [ ] `HOLIDAY_TRIP_NOT_ALLOWED`: `409 Conflict`.
- [ ] `HOLIDAYS_API_UNAVAILABLE`: `502 Bad Gateway`.
- [ ] `INTERNAL_SERVER_ERROR`: `500 Internal Server Error`.
- [ ] Criacao bem-sucedida: `201 Created`.
- [ ] Consultas e cancelamento bem-sucedidos: `200 OK`.

## 5. Plano de entregas

### Fase 1 - Fundacao do projeto

- [x] Inicializar o projeto npm.
- [x] Instalar dependencias de producao e desenvolvimento.
- [x] Configurar TypeScript em modo estrito.
- [x] Configurar scripts `dev`, `start`, `init:db` e `test`.
- [x] Configurar ESLint e Prettier.
- [x] Criar `.gitignore` e impedir o versionamento de `node_modules` e `.env`.
- [x] Criar a estrutura inicial de diretorios.
- [x] Confirmar que o projeto compila sem erros.

Verificacao da fase:

```bash
npm install
npm run build
```

Commit sugerido:

```text
chore: initialize TypeScript backend project
```

### Fase 2 - Ambiente e PostgreSQL

- [x] Criar `.env.example` com valores funcionais.
- [x] Definir `NODE_ENV=development`.
- [x] Definir `PORT=3000`.
- [x] Definir `DATABASE_URL` compativel com o Docker Compose.
- [x] Definir `HOLIDAYS_API_BASE_URL=https://brasilapi.com.br`.
- [x] Criar `docker-compose.yml` com PostgreSQL 16.
- [x] Adicionar healthcheck ao servico do banco.
- [x] Implementar validacao centralizada das variaveis de ambiente.
- [x] Implementar o pool de conexoes PostgreSQL.
- [x] Confirmar que o banco sobe e aceita conexoes.

Verificacao da fase:

```bash
cp .env.example .env
docker compose up -d
docker compose ps
```

Commit sugerido:

```text
chore: configure PostgreSQL development environment
```

### Fase 3 - Schema e inicializacao do banco

- [x] Criar a tabela `trip_requests`.
- [x] Usar UUID como chave primaria.
- [x] Usar `TIMESTAMPTZ` para datas e horas.
- [x] Restringir o status a `pending` e `canceled`.
- [x] Validar `passenger_count > 0` no banco como protecao adicional.
- [x] Criar o script `init:db`.
- [x] Tornar a criacao das estruturas idempotente.
- [x] Inserir pelo menos 10 solicitacoes de viagem.
- [x] Tornar a populacao idempotente.
- [x] Nao inserir ou espelhar feriados no `init:db`.
- [x] Confirmar que o script pode ser executado duas vezes sem falhar ou duplicar dados.

Verificacao da fase:

```bash
npm run init:db
npm run init:db
```

Commit sugerido:

```text
feat: add idempotent database initialization
```

### Fase 4 - Base HTTP e tratamento de erros

- [ ] Criar `app.ts` separado de `server.ts`.
- [ ] Implementar o servidor Fastify.
- [ ] Implementar classes ou estruturas de erro da aplicacao.
- [ ] Implementar handler centralizado de erros.
- [ ] Padronizar respostas de sucesso.
- [ ] Padronizar respostas de erro.
- [ ] Mapear todos os codigos internos para os status HTTP corretos.
- [ ] Garantir que erros inesperados nao exponham detalhes tecnicos.

Commit sugerido:

```text
feat: add HTTP server and centralized error handling
```

### Fase 5 - Integracao com a BrasilAPI

- [ ] Criar um cliente de feriados isolado das rotas.
- [ ] Utilizar `HOLIDAYS_API_BASE_URL` na construcao da URL.
- [ ] Consumir `GET /api/feriados/v1/{ano}`.
- [ ] Validar a resposta recebida da BrasilAPI.
- [ ] Tratar timeout, falha de rede e resposta HTTP invalida.
- [ ] Converter falhas externas em `HOLIDAYS_API_UNAVAILABLE`.
- [ ] Permitir a substituicao do cliente por fake ou mock nos testes.
- [ ] Nao usar feriados estaticos ou hardcoded.
- [ ] Implementar `GET /holidays/:year`.

Commit sugerido:

```text
feat: integrate national holidays API
```

### Fase 6 - Criacao de solicitacoes

- [ ] Validar todos os campos obrigatorios.
- [ ] Rejeitar strings vazias onde nao forem permitidas.
- [ ] Validar e normalizar `departureAt` e `returnAt` para UTC.
- [ ] Rejeitar `returnAt` anterior a `departureAt`.
- [ ] Rejeitar `passengerCount` menor ou igual a zero.
- [ ] Extrair a data civil de `departureAt` ja normalizada.
- [ ] Consultar os feriados do ano da saida.
- [ ] Rejeitar saida em feriado com `HOLIDAY_TRIP_NOT_ALLOWED`.
- [ ] Nao persistir a solicitacao se a BrasilAPI falhar.
- [ ] Criar toda solicitacao com status `pending`.
- [ ] Persistir a solicitacao no PostgreSQL.
- [ ] Retornar `201 Created` e o recurso criado.

Commit sugerido:

```text
feat: implement trip request creation
```

### Fase 7 - Consultas de solicitacoes

- [ ] Implementar `GET /trip-requests`.
- [ ] Retornar todos os registros persistidos.
- [ ] Retornar uma lista vazia quando nao houver registros.
- [ ] Implementar `GET /trip-requests/:id`.
- [ ] Retornar `TRIP_REQUEST_NOT_FOUND` para recurso inexistente.
- [ ] Normalizar todas as datas retornadas para UTC com sufixo `Z`.

Commit sugerido:

```text
feat: implement trip request queries
```

### Fase 8 - Cancelamento

- [ ] Implementar `PATCH /trip-requests/:id/cancel`.
- [ ] Retornar `TRIP_REQUEST_NOT_FOUND` para recurso inexistente.
- [ ] Retornar `TRIP_REQUEST_ALREADY_CANCELED` quando aplicavel.
- [ ] Alterar somente `pending` para `canceled`.
- [ ] Persistir o cancelamento no banco.
- [ ] Retornar `200 OK` e o recurso atualizado.
- [ ] Evitar condicao de corrida no cancelamento.

Commit sugerido:

```text
feat: implement trip request cancellation
```

### Fase 9 - Testes automatizados

Cenarios minimos obrigatorios:

- [ ] Criacao de solicitacao valida.
- [ ] Retorno anterior a saida.
- [ ] Quantidade de passageiros menor ou igual a zero.
- [ ] Saida em feriado nacional.
- [ ] Consulta de solicitacao inexistente.
- [ ] Cancelamento de solicitacao existente.
- [ ] Tentativa de cancelar solicitacao ja cancelada.

Cenarios adicionais para reduzir riscos da avaliacao:

- [ ] Campos obrigatorios ausentes.
- [ ] Data em formato invalido.
- [ ] Normalizacao de data com offset para UTC.
- [ ] Lista vazia de solicitacoes.
- [ ] Cancelamento de solicitacao inexistente.
- [ ] Falha da BrasilAPI durante a criacao.
- [ ] Falha da BrasilAPI na rota de feriados.
- [ ] Respostas com envelopes padronizados.
- [ ] Persistencia das alteracoes no banco.
- [ ] Testes nao dependem da disponibilidade real da BrasilAPI.

Verificacao da fase:

```bash
npm test
```

Commit sugerido:

```text
test: cover trip request API behavior
```

### Fase 10 - Documentacao do repositorio

- [ ] Informar o nome da equipe, se existir.
- [ ] Informar o nome completo de todos os integrantes.
- [ ] Descrever a API.
- [ ] Listar as tecnologias utilizadas.
- [ ] Informar PostgreSQL como SGBD.
- [ ] Informar npm como gerenciador de pacotes.
- [ ] Documentar a instalacao das dependencias.
- [ ] Documentar a configuracao do `.env` sem edicao manual.
- [ ] Documentar a inicializacao do Docker Compose.
- [ ] Documentar `init:db`.
- [ ] Documentar execucao em desenvolvimento e producao.
- [ ] Documentar a execucao dos testes.
- [ ] Documentar todos os endpoints, corpos e respostas.
- [ ] Confirmar que os comandos documentados funcionam em sequencia.

Commit sugerido:

```text
docs: add project setup and API documentation
```

### Fase 11 - Validacao final

- [ ] Executar formatacao e lint.
- [ ] Compilar o TypeScript.
- [ ] Executar todos os testes.
- [ ] Derrubar volumes locais e simular instalacao limpa.
- [ ] Subir o PostgreSQL somente pelo Docker Compose.
- [ ] Executar `init:db` duas vezes.
- [ ] Iniciar a aplicacao seguindo somente o README.
- [ ] Testar manualmente todos os endpoints.
- [ ] Verificar formatos ISO 8601 UTC.
- [ ] Verificar todos os codigos HTTP e codigos internos de erro.
- [ ] Verificar que a BrasilAPI e consultada de verdade fora dos testes.
- [ ] Verificar que nenhum segredo ou arquivo `.env` foi versionado.
- [ ] Verificar que `node_modules` nao foi versionado.
- [ ] Revisar nomenclatura e idioma.
- [ ] Revisar o historico de commits.
- [ ] Confirmar que o repositorio esta publico no GitHub.

Sequencia de validacao limpa:

```bash
npm install
cp .env.example .env
docker compose up -d
npm run init:db
npm run dev
npm test
```

Commits sugeridos para correcoes finais devem descrever exatamente a alteracao. Nao usar mensagens genericas como `fix`, `update` ou `final`.

## 6. Fluxo de Git por entrega

Antes de criar um commit:

```bash
git status
git diff
npm test
```

Depois de validar a entrega:

```bash
git add <arquivos-da-entrega>
git commit -m "<type>: <clear description in English>"
git push origin main
```

Tipos de commit adotados:

- `chore`: configuracao, ferramentas e manutencao.
- `feat`: nova funcionalidade.
- `test`: criacao ou melhoria de testes.
- `fix`: correcao objetiva de defeito.
- `docs`: documentacao.
- `refactor`: reorganizacao sem mudanca de comportamento.

Regras dos commits:

- [ ] Cada commit representa uma alteracao compreensivel e funcional.
- [ ] A mensagem e escrita em ingles.
- [ ] A mensagem explica o que foi entregue.
- [ ] Testes e implementacao relacionada podem ficar no mesmo commit da funcionalidade.
- [ ] Arquivos sem relacao com a entrega nao entram no commit.
- [ ] O commit somente e criado depois das verificacoes aplicaveis.
- [ ] O push ocorre imediatamente apos o commit validado.
- [ ] Nao reescrever ou apagar o historico compartilhado.

## 7. Matriz dos criterios de avaliacao

### Correcao funcional e regras - 30%

- [ ] Criacao, listagem, consulta e cancelamento funcionam.
- [ ] Todas as regras obrigatorias sao aplicadas.
- [ ] Dados sao persistidos no PostgreSQL.

### Testes automatizados - 30%

- [ ] Todos os cenarios minimos possuem testes Vitest.
- [ ] Testes sao deterministas e independentes da BrasilAPI real.
- [ ] `npm test` executa toda a suite.

### Erros e respostas - 15%

- [ ] Erros sao tratados centralmente.
- [ ] Todas as respostas seguem o contrato.
- [ ] Nenhum detalhe interno e exposto.

### Modelagem REST - 10%

- [ ] Rotas, metodos e status HTTP seguem exatamente o enunciado.
- [ ] O recurso principal se chama `trip-requests`.

### BrasilAPI - 10%

- [ ] A integracao utiliza dados reais da BrasilAPI em execucao normal.
- [ ] A URL base vem de `HOLIDAYS_API_BASE_URL`.
- [ ] Falhas externas sao tratadas corretamente.

### Historico de commits - 5%

- [ ] Existem varios commits relevantes.
- [ ] As mensagens sao claras, objetivas e em ingles.
- [ ] O historico demonstra desenvolvimento incremental.

## 8. Definicao de produto final

O projeto somente estara pronto quando:

- [ ] Todas as caixas obrigatorias deste guia estiverem concluidas.
- [ ] O projeto puder ser executado do zero apenas com o README.
- [ ] O banco for criado e populado sem intervencao manual.
- [ ] Todos os testes passarem.
- [ ] Todos os endpoints respeitarem o contrato do PDF.
- [ ] A integracao real com a BrasilAPI estiver funcional.
- [ ] O repositorio publico contiver um historico incremental de commits.
- [ ] Todos os integrantes conseguirem explicar as principais decisoes tecnicas.
