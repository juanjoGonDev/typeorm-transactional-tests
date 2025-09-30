# TypeORM Test DB

## Visão geral

TypeORM Test DB envolve cada spec do Jest em uma transação de banco de dados isolada. O helper aceita qualquer `DataSource` inicializado, substitui seu manager durante a spec e restaura o manager original após o rollback. O pacote atende configurações de teste reutilizáveis que mantêm o banco de dados de integração limpo.

## Recursos

- Helper do ciclo de vida do banco de dados de testes para TypeORM com hooks explícitos `init` e `finish`.
- Integração agnóstica de framework ao invocar o ciclo de vida dentro dos hooks do runner de testes.
- Compatibilidade com MySQL, MariaDB, PostgreSQL, SQLite e Better SQLite 3.
- Fábricas de dados determinísticas impulsionadas por uma semente de execução reproduzível.
- Configuração de testes compartilhada que inicializa uma única conexão por worker e executa as specs em paralelo.
- Relatórios de cobertura gerados por padrão através de `pnpm test`.
- Artefatos de build gerados por `pnpm build` e consumidos pelo Jest para simular uma instalação do pacote.

## Instalação

<details>
<summary>pnpm</summary>

```bash
pnpm add -D typeorm-test-db
pnpm add typeorm
```

</details>

<details>
<summary>npm</summary>

```bash
npm install -D typeorm-test-db
npm install typeorm
```

</details>

<details>
<summary>Yarn</summary>

```bash
yarn add -D typeorm-test-db
yarn add typeorm
```

</details>

Instale o TypeORM no projeto hospedeiro caso ainda não esteja disponível.

## Uso

Crie um arquivo de configuração do Jest que inicialize a conexão e registre o ciclo de vida do banco de dados de testes para TypeORM.

```typescript
import { afterAll, afterEach, beforeAll, beforeEach } from "@jest/globals";
import { DataSource } from "typeorm";
import { TypeormTestDB } from "typeorm-test-db";

const dataSource = new DataSource({
  type: "mysql",
  host: "127.0.0.1",
  port: 3306,
  username: "root",
  password: "test",
  database: "test",
  synchronize: true,
  entities: [],
});

const lifecycle = TypeormTestDB(dataSource, {
  isolationLevel: "REPEATABLE READ",
});

beforeEach(async () => {
  await lifecycle.init();
});

afterEach(async () => {
  await lifecycle.finish();
});
```

Importe seus repositórios ou managers dentro das specs. Todas as mutações executadas entre os hooks registrados são revertidas automaticamente.

## Execução dos testes

A suíte gera dados reproduzíveis por spec e expõe a variável de ambiente `TEST_SEED` para controlar a ordem de execução. `pnpm test` executa o Jest em workers paralelos e força a coleta de cobertura.

## Integração contínua

O workflow do GitHub Actions executa o lint e a suíte do Jest contra uma matriz de bancos de dados transacionais. Um job final de agregação falha quando qualquer job da matriz apresenta erro, mantendo o check obrigatório estável mesmo com a adição de novos bancos.

## Desenvolvimento

- `pnpm lint` verifica a qualidade do código.
- `pnpm build` gera o bundle de produção em `dist`.
- `pnpm test` recompila o pacote, executa os testes com dados semente e verifica que o tarball pode ser instalado em um projeto limpo.

## Licença

TypeORM Test DB está disponível sob a GNU General Public License v3.0 ou posterior.
