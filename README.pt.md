# TypeORM Transactional Tests

## Visão geral

TypeORM Transactional Tests envolve cada spec do Jest em uma transação isolada. O helper recebe qualquer `DataSource` inicializado, substitui o manager durante o teste e restaura o manager original após o rollback. O pacote viabiliza cenários de integração reutilizáveis mantendo o banco consistente.

## Recursos

- Ciclo de vida transacional com hooks `init` e `finish` explícitos.
- Compatível com MySQL, MariaDB, PostgreSQL, SQLite e Better SQLite 3.
- Fabricas determinísticas orientadas por uma semente reproduzível.
- Configuração compartilhada que cria uma conexão por worker e executa os testes em paralelo.
- Relatórios de cobertura ativados por padrão com `pnpm test`.
- A compilação emitida por `pnpm build` alimenta a suíte para simular a instalação via npm.

## Instalação

```bash
pnpm add typeorm-transactional-tests
pnpm add typeorm # dependência peer
```

Instale TypeORM no projeto se ainda não estiver disponível.

## Uso

Crie um arquivo de setup do Jest que inicialize o `DataSource` e registre o ciclo de vida transacional.

```typescript
import { DataSource } from 'typeorm';
import { createTransactionalTestContext } from 'typeorm-transactional-tests';

const dataSource = new DataSource({
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: 'test',
  database: 'test',
  synchronize: true,
  entities: [/* entidades */]
});

const transactionalContext = createTransactionalTestContext(dataSource);

beforeAll(async () => {
  await dataSource.initialize();
});

afterAll(async () => {
  await dataSource.destroy();
});

beforeEach(async () => {
  await transactionalContext.init();
});

afterEach(async () => {
  await transactionalContext.finish();
});
```

Importe `createTransactionalTestContext` nas specs e escreva asserções contra os repositórios ou o entity manager. Tudo que ocorrer entre `init` e `finish` é revertido automaticamente.

## Execução de testes

A suíte gera fixtures reproduzíveis por spec e expõe a variável `TEST_SEED` para controlar a ordem de execução. `pnpm test` executa o Jest em paralelo, coleta cobertura obrigatória e recompila o pacote para validar o artefato distribuído.

## Integração contínua

O workflow do GitHub Actions executa o lint e roda a suíte em uma matriz de bancos transacionais. Um job de agregação final falha quando qualquer item da matriz falha, preservando o check obrigatório mesmo quando novos bancos são adicionados.

## Desenvolvimento

- `pnpm lint` avalia a qualidade do código.
- `pnpm build` gera o bundle de produção em `dist`.
- `pnpm test` recompila o pacote, executa os testes de integração com sementes determinísticas e valida a instalação do tarball em um projeto limpo.

## Licença

TypeORM Transactional Tests está disponível sob a GNU General Public License v3.0 ou posterior.
