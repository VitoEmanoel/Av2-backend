# Institutional Trip Requests API

API REST para gerenciamento simplificado de solicitações de viagens institucionais. A aplicação permite criar, listar, consultar e cancelar solicitações, além de consultar feriados nacionais por meio da BrasilAPI.

Toda nova solicitação é validada antes da persistência. Viagens com saída em feriado nacional são rejeitadas, e falhas na consulta externa impedem a criação do registro.

## Integrantes

A equipe não possui nome definido.

Integrantes:

- Cristian Brandão Tavares
- Francisco Osmar Santos Silva
- Richard Costa de Brito
- Victor Emanoel Lima Silva

## Tecnologias

- Node.js 20 ou superior
- TypeScript em modo estrito
- Fastify
- PostgreSQL 16
- Docker Compose
- `pg` para acesso ao banco de dados
- Zod para validação
- Vitest para testes automatizados
- `fetch` nativo para integração com a BrasilAPI
- ESLint e Prettier

O SGBD adotado é o PostgreSQL e o gerenciador de pacotes utilizado é o npm.

## Requisitos

- Node.js 20 ou superior
- npm 10 ou superior
- Docker com Docker Compose
- Porta `3000` disponível para a API
- Porta `5432` disponível para o PostgreSQL

## Instalação e execução

Execute os comandos abaixo na raiz do projeto:

```bash
npm install
cp .env.example .env
docker compose up -d --wait
npm run init:db
npm run dev
```

A API ficará disponível em `http://localhost:3000`.

O comando que cria o `.env` apenas copia valores funcionais do `.env.example`; nenhuma edição manual é necessária.

### Variáveis de ambiente

O arquivo `.env.example` contém:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://trip_requests:trip_requests_password@localhost:5432/trip_requests
HOLIDAYS_API_BASE_URL=https://brasilapi.com.br
```

- `NODE_ENV`: ambiente de execução.
- `PORT`: porta HTTP da aplicação.
- `DATABASE_URL`: conexão compatível com o PostgreSQL do Docker Compose.
- `HOLIDAYS_API_BASE_URL`: URL base utilizada pelo cliente de feriados.

### Banco de dados

Para iniciar somente o PostgreSQL:

```bash
docker compose up -d --wait
```

Para criar a tabela e inserir os dados iniciais:

```bash
npm run init:db
```

O script é idempotente: pode ser executado novamente sem duplicar registros ou interromper a aplicação. Ele insere 10 solicitações de viagem e não realiza carga ou espelhamento de feriados.

Para verificar o estado do container:

```bash
docker compose ps
```

Para encerrar o PostgreSQL sem apagar os dados:

```bash
docker compose down
```

### Execução de produção

```bash
npm run build
npm start
```

## Scripts

| Comando                 | Descrição                                                             |
| ----------------------- | --------------------------------------------------------------------- |
| `npm run dev`           | Inicia a API em modo de desenvolvimento com recarregamento automático |
| `npm run build`         | Compila o TypeScript para o diretório `dist`                          |
| `npm start`             | Executa a versão compilada                                            |
| `npm run init:db`       | Cria e popula o banco de forma idempotente                            |
| `npm test`              | Executa todos os testes com Vitest                                    |
| `npm run test:coverage` | Executa os testes e gera o relatório de cobertura                     |
| `npm run lint`          | Verifica o código com ESLint                                          |
| `npm run format`        | Formata os arquivos com Prettier                                      |
| `npm run format:check`  | Verifica a formatação sem alterar arquivos                            |

## Testes

O PostgreSQL deve estar em execução antes dos testes:

```bash
docker compose up -d --wait
npm test
```

A suíte possui testes HTTP, testes das regras de negócio, mocks da integração externa e testes reais do repositório PostgreSQL. Os registros criados pelos testes são removidos automaticamente.

Os testes não dependem da disponibilidade real da BrasilAPI. Respostas externas, erros HTTP, falhas de rede e timeout são simulados por implementações controladas.

Para executar com cobertura:

```bash
npm run test:coverage
```

O projeto exige cobertura mínima de 80% para statements, branches, functions e lines.

## Contrato da API

Todas as datas e horas são recebidas, persistidas e retornadas em ISO 8601 completo, normalizadas para UTC com sufixo `Z`:

```text
YYYY-MM-DDTHH:mm:ss.sssZ
```

### Resposta de sucesso

```json
{
  "success": true,
  "data": {}
}
```

### Resposta de erro

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "A clear and objective error message"
  }
}
```

As mensagens de erro são retornadas em inglês e não expõem stack traces, consultas SQL ou detalhes internos.

## Endpoints

### Criar solicitação

```http
POST /trip-requests
```

Corpo:

```json
{
  "requesterName": "Maria Silva",
  "origin": "Parnaíba",
  "destination": "Teresina",
  "departureAt": "2026-07-07T10:00:00.000Z",
  "returnAt": "2026-07-07T18:00:00.000Z",
  "purpose": "Participation in an institutional meeting",
  "passengerCount": 3
}
```

Retorna `201 Created`. A solicitação é criada com status `pending`. A data de retorno deve ser posterior ou igual à saída, `passengerCount` deve ser maior que zero e a saída não pode ocorrer em feriado nacional.

Exemplo de resposta:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "requesterName": "Maria Silva",
    "origin": "Parnaíba",
    "destination": "Teresina",
    "departureAt": "2026-07-07T10:00:00.000Z",
    "returnAt": "2026-07-07T18:00:00.000Z",
    "purpose": "Participation in an institutional meeting",
    "passengerCount": 3,
    "status": "pending",
    "createdAt": "2026-06-20T14:30:00.000Z"
  }
}
```

### Listar solicitações

```http
GET /trip-requests
```

Retorna `200 OK` com todas as solicitações. Quando não houver registros, `data` será uma lista vazia.

### Consultar solicitação

```http
GET /trip-requests/:id
```

Retorna `200 OK` com a solicitação correspondente. Um UUID inexistente retorna `404 TRIP_REQUEST_NOT_FOUND`.

### Cancelar solicitação

```http
PATCH /trip-requests/:id/cancel
```

Retorna `200 OK` com a solicitação atualizada para `canceled`. Uma solicitação inexistente retorna `404 TRIP_REQUEST_NOT_FOUND`; uma solicitação já cancelada retorna `409 TRIP_REQUEST_ALREADY_CANCELED`.

### Consultar feriados nacionais

```http
GET /holidays/:year
```

Exemplo:

```http
GET /holidays/2026
```

Retorna `200 OK` com dados obtidos em tempo real da BrasilAPI:

```json
{
  "success": true,
  "data": [
    {
      "date": "2026-01-01",
      "name": "Confraternização Universal",
      "type": "national"
    }
  ]
}
```

Se a BrasilAPI estiver indisponível ou retornar uma resposta inválida, o endpoint retorna `502 HOLIDAYS_API_UNAVAILABLE`.

## Códigos de erro

| Código                          | HTTP | Situação                                          |
| ------------------------------- | ---: | ------------------------------------------------- |
| `VALIDATION_ERROR`              |  400 | Dados ausentes, inválidos ou em formato incorreto |
| `TRIP_REQUEST_NOT_FOUND`        |  404 | Solicitação não encontrada                        |
| `ROUTE_NOT_FOUND`               |  404 | Rota inexistente                                  |
| `TRIP_REQUEST_ALREADY_CANCELED` |  409 | Solicitação já cancelada                          |
| `HOLIDAY_TRIP_NOT_ALLOWED`      |  409 | Data de saída em feriado nacional                 |
| `HOLIDAYS_API_UNAVAILABLE`      |  502 | Falha na integração com a BrasilAPI               |
| `INTERNAL_SERVER_ERROR`         |  500 | Erro inesperado da aplicação                      |

## Organização do projeto

```text
src/
  config/         # Environment configuration
  database/       # PostgreSQL connection and schema
  domain/         # Domain contracts
  errors/         # Application errors and centralized handler
  http/           # Routes, schemas, and response envelopes
  integrations/   # BrasilAPI client
  repositories/   # Persistence contracts and PostgreSQL implementation
  services/       # Business rules
  app.ts           # Testable Fastify application
  server.ts        # HTTP server bootstrap
scripts/           # Database initialization
tests/             # Unit, HTTP, and PostgreSQL integration tests
```
