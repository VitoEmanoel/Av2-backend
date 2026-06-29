# Guia de Desenvolvimento - API de Solicitacoes de Viagem

Este documento transforma o enunciado da segunda avaliacao de Programacao Backend em um plano executavel. O arquivo `docs/pbak-aval2.pdf` continua sendo a fonte oficial dos requisitos. Em caso de divergencia, o PDF prevalece.

## 1. Regras de trabalho

- [x] Ler integralmente o enunciado da avaliacao.
- [x] Definir a stack e a arquitetura inicial.
- [x] Criar o guia de desenvolvimento e acompanhamento.
- [x] Implementar uma fase por vez, respeitando a ordem deste documento.
- [x] Executar as verificacoes da fase antes de marca-la como concluida.
- [x] Atualizar as caixas deste documento ao concluir cada entrega.
- [x] Criar um commit relevante ao final de cada entrega.
- [x] Enviar cada commit para o repositorio remoto com `git push`.
- [x] Nao agrupar todo o desenvolvimento em um unico commit final.
- [x] Manter codigo, identificadores, testes, logs, erros e commits em ingles.

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

- [x] `id`: UUID unico.
- [x] `requesterName`: nome do solicitante.
- [x] `origin`: cidade de origem.
- [x] `destination`: cidade de destino.
- [x] `departureAt`: data e hora de saida.
- [x] `returnAt`: data e hora de retorno.
- [x] `purpose`: finalidade da viagem.
- [x] `passengerCount`: quantidade de passageiros.
- [x] `status`: `pending` ou `canceled`.
- [x] `createdAt`: data e hora de criacao.

Datas devem ser recebidas, persistidas e retornadas como ISO 8601 completo em UTC:

```text
YYYY-MM-DDTHH:mm:ss.sssZ
```

### 4.2 Endpoints

- [x] `POST /trip-requests`: criar uma solicitacao.
- [x] `GET /trip-requests`: listar todas as solicitacoes.
- [x] `GET /trip-requests/:id`: consultar uma solicitacao.
- [x] `PATCH /trip-requests/:id/cancel`: cancelar uma solicitacao.
- [x] `GET /holidays/:year`: consultar feriados nacionais.

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

- [x] Toda resposta de sucesso segue o envelope obrigatorio.
- [x] Toda resposta de erro segue o envelope obrigatorio.
- [x] Mensagens de erro estao em ingles.
- [x] Nenhuma resposta expoe stack trace, SQL ou detalhes internos.

### 4.4 Erros e status HTTP

- [x] `VALIDATION_ERROR`: `400 Bad Request`.
- [x] `TRIP_REQUEST_NOT_FOUND`: `404 Not Found`.
- [x] `TRIP_REQUEST_ALREADY_CANCELED`: `409 Conflict`.
- [x] `HOLIDAY_TRIP_NOT_ALLOWED`: `409 Conflict`.
- [x] `HOLIDAYS_API_UNAVAILABLE`: `502 Bad Gateway`.
- [x] `INTERNAL_SERVER_ERROR`: `500 Internal Server Error`.
- [x] Criacao bem-sucedida: `201 Created`.
- [x] Consultas e cancelamento bem-sucedidos: `200 OK`.

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

- [x] Criar `app.ts` separado de `server.ts`.
- [x] Implementar o servidor Fastify.
- [x] Implementar classes ou estruturas de erro da aplicacao.
- [x] Implementar handler centralizado de erros.
- [x] Padronizar respostas de sucesso.
- [x] Padronizar respostas de erro.
- [x] Mapear todos os codigos internos para os status HTTP corretos.
- [x] Garantir que erros inesperados nao exponham detalhes tecnicos.

Commit sugerido:

```text
feat: add HTTP server and centralized error handling
```

### Fase 5 - Integracao com a BrasilAPI

- [x] Criar um cliente de feriados isolado das rotas.
- [x] Utilizar `HOLIDAYS_API_BASE_URL` na construcao da URL.
- [x] Consumir `GET /api/feriados/v1/{ano}`.
- [x] Validar a resposta recebida da BrasilAPI.
- [x] Tratar timeout, falha de rede e resposta HTTP invalida.
- [x] Converter falhas externas em `HOLIDAYS_API_UNAVAILABLE`.
- [x] Permitir a substituicao do cliente por fake ou mock nos testes.
- [x] Nao usar feriados estaticos ou hardcoded.
- [x] Implementar `GET /holidays/:year`.

Commit sugerido:

```text
feat: integrate national holidays API
```

### Fase 6 - Criacao de solicitacoes

- [x] Validar todos os campos obrigatorios.
- [x] Rejeitar strings vazias onde nao forem permitidas.
- [x] Validar e normalizar `departureAt` e `returnAt` para UTC.
- [x] Rejeitar `returnAt` anterior a `departureAt`.
- [x] Rejeitar `passengerCount` menor ou igual a zero.
- [x] Extrair a data civil de `departureAt` ja normalizada.
- [x] Consultar os feriados do ano da saida.
- [x] Rejeitar saida em feriado com `HOLIDAY_TRIP_NOT_ALLOWED`.
- [x] Nao persistir a solicitacao se a BrasilAPI falhar.
- [x] Criar toda solicitacao com status `pending`.
- [x] Persistir a solicitacao no PostgreSQL.
- [x] Retornar `201 Created` e o recurso criado.

Commit sugerido:

```text
feat: implement trip request creation
```

### Fase 7 - Consultas de solicitacoes

- [x] Implementar `GET /trip-requests`.
- [x] Retornar todos os registros persistidos.
- [x] Retornar uma lista vazia quando nao houver registros.
- [x] Implementar `GET /trip-requests/:id`.
- [x] Retornar `TRIP_REQUEST_NOT_FOUND` para recurso inexistente.
- [x] Normalizar todas as datas retornadas para UTC com sufixo `Z`.

Commit sugerido:

```text
feat: implement trip request queries
```

### Fase 8 - Cancelamento

- [x] Implementar `PATCH /trip-requests/:id/cancel`.
- [x] Retornar `TRIP_REQUEST_NOT_FOUND` para recurso inexistente.
- [x] Retornar `TRIP_REQUEST_ALREADY_CANCELED` quando aplicavel.
- [x] Alterar somente `pending` para `canceled`.
- [x] Persistir o cancelamento no banco.
- [x] Retornar `200 OK` e o recurso atualizado.
- [x] Evitar condicao de corrida no cancelamento.

Commit sugerido:

```text
feat: implement trip request cancellation
```

### Fase 9 - Testes automatizados

Cenarios minimos obrigatorios:

- [x] Criacao de solicitacao valida.
- [x] Retorno anterior a saida.
- [x] Quantidade de passageiros menor ou igual a zero.
- [x] Saida em feriado nacional.
- [x] Consulta de solicitacao inexistente.
- [x] Cancelamento de solicitacao existente.
- [x] Tentativa de cancelar solicitacao ja cancelada.

Cenarios adicionais para reduzir riscos da avaliacao:

- [x] Campos obrigatorios ausentes.
- [x] Data em formato invalido.
- [x] Normalizacao de data com offset para UTC.
- [x] Lista vazia de solicitacoes.
- [x] Cancelamento de solicitacao inexistente.
- [x] Falha da BrasilAPI durante a criacao.
- [x] Falha da BrasilAPI na rota de feriados.
- [x] Respostas com envelopes padronizados.
- [x] Persistencia das alteracoes no banco.
- [x] Testes nao dependem da disponibilidade real da BrasilAPI.

Verificacao da fase:

```bash
npm test
```

Commit sugerido:

```text
test: cover trip request API behavior
```

### Fase 10 - Documentacao do repositorio

- [x] Informar o nome da equipe, se existir.
- [x] Informar o nome completo de todos os integrantes.
- [x] Descrever a API.
- [x] Listar as tecnologias utilizadas.
- [x] Informar PostgreSQL como SGBD.
- [x] Informar npm como gerenciador de pacotes.
- [x] Documentar a instalacao das dependencias.
- [x] Documentar a configuracao do `.env` sem edicao manual.
- [x] Documentar a inicializacao do Docker Compose.
- [x] Documentar `init:db`.
- [x] Documentar execucao em desenvolvimento e producao.
- [x] Documentar a execucao dos testes.
- [x] Documentar todos os endpoints, corpos e respostas.
- [x] Confirmar que os comandos documentados funcionam em sequencia.

Commit sugerido:

```text
docs: add project setup and API documentation
```

### Fase 11 - Validacao final

- [x] Executar formatacao e lint.
- [x] Compilar o TypeScript.
- [x] Executar todos os testes.
- [x] Derrubar volumes locais e simular instalacao limpa.
- [x] Subir o PostgreSQL somente pelo Docker Compose.
- [x] Executar `init:db` duas vezes.
- [x] Iniciar a aplicacao seguindo somente o README.
- [x] Testar manualmente todos os endpoints.
- [x] Verificar formatos ISO 8601 UTC.
- [x] Verificar todos os codigos HTTP e codigos internos de erro.
- [x] Verificar que a BrasilAPI e consultada de verdade fora dos testes.
- [x] Verificar que nenhum segredo ou arquivo `.env` foi versionado.
- [x] Verificar que `node_modules` nao foi versionado.
- [x] Revisar nomenclatura e idioma.
- [x] Revisar o historico de commits.
- [x] Confirmar que o repositorio esta publico no GitHub.

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

- [x] Cada commit representa uma alteracao compreensivel e funcional.
- [x] A mensagem e escrita em ingles.
- [x] A mensagem explica o que foi entregue.
- [x] Testes e implementacao relacionada podem ficar no mesmo commit da funcionalidade.
- [x] Arquivos sem relacao com a entrega nao entram no commit.
- [x] O commit somente e criado depois das verificacoes aplicaveis.
- [x] O push ocorre imediatamente apos o commit validado.
- [x] Nao reescrever ou apagar o historico compartilhado.

## 7. Matriz dos criterios de avaliacao

### Correcao funcional e regras - 30%

- [x] Criacao, listagem, consulta e cancelamento funcionam.
- [x] Todas as regras obrigatorias sao aplicadas.
- [x] Dados sao persistidos no PostgreSQL.

### Testes automatizados - 30%

- [x] Todos os cenarios minimos possuem testes Vitest.
- [x] Testes sao deterministas e independentes da BrasilAPI real.
- [x] `npm test` executa toda a suite.

### Erros e respostas - 15%

- [x] Erros sao tratados centralmente.
- [x] Todas as respostas seguem o contrato.
- [x] Nenhum detalhe interno e exposto.

### Modelagem REST - 10%

- [x] Rotas, metodos e status HTTP seguem exatamente o enunciado.
- [x] O recurso principal se chama `trip-requests`.

### BrasilAPI - 10%

- [x] A integracao utiliza dados reais da BrasilAPI em execucao normal.
- [x] A URL base vem de `HOLIDAYS_API_BASE_URL`.
- [x] Falhas externas sao tratadas corretamente.

### Historico de commits - 5%

- [x] Existem varios commits relevantes.
- [x] As mensagens sao claras, objetivas e em ingles.
- [x] O historico demonstra desenvolvimento incremental.

## 8. Definicao de produto final

O projeto somente estara pronto quando:

- [ ] Todas as caixas obrigatorias deste guia estiverem concluidas.
- [x] O projeto puder ser executado do zero apenas com o README.
- [x] O banco for criado e populado sem intervencao manual.
- [x] Todos os testes passarem.
- [x] Todos os endpoints respeitarem o contrato do PDF.
- [x] A integracao real com a BrasilAPI estiver funcional.
- [x] O repositorio publico contiver um historico incremental de commits.
- [ ] Todos os integrantes conseguirem explicar as principais decisoes tecnicas.
