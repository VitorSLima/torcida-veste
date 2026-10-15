# Torcida Veste — Fase 1: Backend Pronto para a Loja

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar a API NestJS segura, em Postgres e com catálogo público (ofertas, busca, imagens), cadastro e login com Google funcionando, pronta para o front-end consumir.

**Architecture:** Mantém o NestJS atual (controllers → services → use-cases → repositories, Prisma). Acrescenta um `RolesGuard` (hoje `@Roles` não faz nada), cadastro (`POST /auth/register`), troca de código do Google (`POST /auth/google/exchange`), filtros/paginação em produtos e um seed com dados de demonstração. Pedidos e Stripe ficam na Fase 4.

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL 16 (Docker local, Neon em produção), Jest + ts-jest, class-validator + class-transformer.

Spec de origem: `docs/superpowers/specs/2026-10-14-torcida-veste-storefront-design.md`

**Planos seguintes (escritos depois, cada um depende do anterior):** Fase 2 front base · Fase 3 auth/carrinho no front · Fase 4 pedidos + Stripe · Fase 5 responsivo, README e deploy.

## Convenções

- Todos os comandos rodam em `torcida-veste-api/` (`cd "/Users/vitorlima/Desktop/projetos e freelances/torcida-veste/torcida-veste-api"`), salvo indicação.
- Testes ficam ao lado do código (`*.spec.ts`, `rootDir` do Jest é `src`).
- Mensagens de commit terminam com a linha `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` (uma linha em branco antes).
- Use imports **relativos** (nunca `from 'src/...'`): o Jest está mapeado, mas `node dist/main` e a Vercel não resolvem `src/`.

## Achados que motivam esta fase (já verificados no código)

| Achado | Onde | Tratamento |
|---|---|---|
| `@Roles('ADMIN')` é só metadata; nenhum guard o lê. Qualquer usuário logado cria/apaga produto, categoria, liga, cupom | controllers | Tasks 3–4 |
| JWT emitido com `role: 'ADMIN'` fixo para todos | `auth.service.ts` | Task 3 |
| `/user` sem controle: qualquer logado lista/edita/apaga qualquer usuário; `PATCH` aceita `role` e `password` em texto puro | `users.controller.ts` | Task 4 |
| Não existe cadastro | — | Task 5 |
| Login de usuário Google (senha nula) estoura em `bcrypt.compare(null)` | `validateUser` | Task 3 |
| Callback do Google devolve JSON sem token | `auth.controller.ts` | Task 6 |
| `class-transformer` não está nas dependências; `node_modules` não instalado | `package.json` | Tasks 1 e 7 |
| 3 imports `from 'src/...'` | auth.service, users.repository, product.controller | Task 1 |

**Fora desta fase (registrar, não corrigir):** `GET /address` lista endereços de qualquer usuário (sem dono no modelo); use-cases de update/delete de produto não dão `await` na operação; repositórios engolem erros em `try/catch`.

---

### Task 0: Branch e checkpoint do trabalho pendente

O repositório tem alterações não commitadas do usuário em `torcida-veste-api/` (auth, category, prisma, seed, `address/` etc.). Elas não podem ser misturadas nos commits desta fase.

**Files:** nenhum.

- [ ] **Step 1: Pedir autorização ao usuário**

Perguntar: "Posso criar a branch `feat/storefront-backend` e commitar suas alterações pendentes do backend como um commit `wip` separado, para manter meus commits limpos?" Só continuar com um "sim". Se o usuário preferir outro arranjo, seguir o dele.

- [ ] **Step 2: Criar a branch e commitar o WIP**

```bash
cd "/Users/vitorlima/Desktop/projetos e freelances/torcida-veste"
git checkout -b feat/storefront-backend
git add torcida-veste-api
git status --short
```
Expected: só arquivos de `torcida-veste-api/` em "A/M". `Torcida Veste/`, `docs/` e `.DS_Store` seguem fora.

```bash
git commit -m "wip: pending backend changes before storefront work

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 1: Dependências, Jest e imports relativos

**Files:**
- Modify: `package.json` (bloco `jest`)
- Modify: `src/auth/auth.service.ts:11`
- Modify: `src/users/repository/users.repository.ts:3`
- Modify: `tsconfig.build.json`

- [ ] **Step 1: Instalar dependências**

```bash
npm install
npx prisma generate
```
Expected: instalação sem erro; `Generated Prisma Client`.

- [ ] **Step 2: Mapear `src/` no Jest**

Em `package.json`, dentro de `"jest": { ... }`, adicionar depois de `"testEnvironment": "node"` (lembrar da vírgula):

```json
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^src/(.*)$": "<rootDir>/$1"
    }
```

- [ ] **Step 3: Trocar os imports absolutos por relativos**

Em `src/auth/auth.service.ts` linha 11:
```ts
import { UsersRepository } from '../users/repository/users.repository';
```
Em `src/users/repository/users.repository.ts` linha 3:
```ts
import { PrismaService } from '../../shared/databases/prisma.database';
```
(`product.controller.ts` é reescrito na Task 7 já com import relativo.)

- [ ] **Step 4: Excluir helpers de teste do build**

Substituir o conteúdo de `tsconfig.build.json` por:
```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts", "**/testing/**"]
}
```

- [ ] **Step 5: Registrar a linha de base**

```bash
npx jest
npx nest build
grep -rn "from 'src/" src
```
Expected: Jest passa (`app.controller.spec.ts`); build termina sem erro; o `grep` só mostra `src/product/product.controller.ts` (ainda não reescrito). Se o Jest ou o build já falharem **antes** das suas mudanças, anotar a saída e informar ao usuário antes de seguir.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.build.json src/auth/auth.service.ts src/users/repository/users.repository.ts
git commit -m "chore: install deps, map src/ in jest, use relative imports

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Postgres, `originalPrice` e `AuthCode`

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `docker-compose.yml`
- Modify: `.env` (ignorado pelo git)
- Create: `.env.example`
- Delete: `prisma/migrations/*` (17 migrations MySQL; recuperáveis via git)
- Create: `prisma/migrations/<timestamp>_init/` (gerada)

- [ ] **Step 1: Editar o schema**

Em `prisma/schema.prisma`:

1. `datasource db`: trocar `provider = "mysql"` por `provider = "postgresql"`.
2. No `model Product`, depois de `price        Float`, adicionar:
```prisma
  originalPrice Float?
```
3. No `model User`, depois de `sessions   Session[]`, adicionar:
```prisma
  authCodes  AuthCode[]
```
4. Ao final do arquivo, antes dos `enum`, adicionar:
```prisma
model AuthCode {
  id         String   @id @default(uuid())
  code_hash  String   @unique
  user_id    String
  expires_at DateTime
  User       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@map("auth_codes")
}
```

- [ ] **Step 2: Docker Compose com Postgres**

Substituir `docker-compose.yml` por (novo nome de container para não colidir com o MySQL antigo do usuário):
```yaml
version: '3'

services:
  postgres:
    image: postgres:16
    container_name: torcida-veste-pg
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin
      POSTGRES_DB: torcida-veste
    ports:
      - 5433:5432
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: always

volumes:
  pgdata:
```

- [ ] **Step 3: Variáveis de ambiente**

Em `.env`, trocar `DATABASE_URL` por:
```
DATABASE_URL="postgresql://admin:admin@localhost:5433/torcida-veste?schema=public"
```
e acrescentar `FRONTEND_URL=http://localhost:3001`. Manter as demais chaves.

Criar `.env.example`:
```
DATABASE_URL="postgresql://admin:admin@localhost:5433/torcida-veste?schema=public"
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

JWT_SECRET=troque-por-um-segredo-longo

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=Torcida
ADMIN_EMAIL=admin@torcidaveste.com
ADMIN_PASSWORD=troque-esta-senha
```

- [ ] **Step 4: Recriar as migrations**

```bash
docker compose up -d postgres
rm -rf prisma/migrations
npx prisma migrate dev --name init
```
Expected: `Your database is now in sync with your schema.` e uma pasta `prisma/migrations/<timestamp>_init/` + `migration_lock.toml` com `provider = "postgresql"`.

- [ ] **Step 5: Verificar**

```bash
npx prisma validate
git check-ignore .env
```
Expected: `The schema at prisma/schema.prisma is valid`; `.env` listado (ignorado). Nunca commitar `.env`.

- [ ] **Step 6: Commit**

```bash
git add prisma docker-compose.yml .env.example
git commit -m "feat(db): migrate to postgres, add originalPrice and AuthCode

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `RolesGuard` e role correta nos tokens

**Files:**
- Create: `src/auth/guards/roles.guard.ts`
- Create: `src/auth/guards/roles.guard.spec.ts`
- Create: `src/auth/testing/make-auth-service.ts`
- Create: `src/auth/auth.service.spec.ts`
- Modify: `src/auth/auth.service.ts`

- [ ] **Step 1: Escrever o teste do guard**

`src/auth/guards/roles.guard.spec.ts`:
```ts
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function contextWith(user: unknown): ExecutionContext {
    return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);

    afterEach(() => jest.restoreAllMocks());

    it('allows when no roles are required', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
        expect(guard.canActivate(contextWith({ userRole: 'USER' }))).toBe(true);
    });

    it('allows when the user has a required role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
        expect(guard.canActivate(contextWith({ userRole: 'ADMIN' }))).toBe(true);
    });

    it('forbids when the user lacks the required role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
        expect(() => guard.canActivate(contextWith({ userRole: 'USER' }))).toThrow(
            ForbiddenException,
        );
    });

    it('forbids when there is no authenticated user', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
        expect(() => guard.canActivate(contextWith(undefined))).toThrow(
            ForbiddenException,
        );
    });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/auth/guards/roles.guard.spec.ts`
Expected: FAIL — `Cannot find module './roles.guard'`.

- [ ] **Step 3: Implementar o guard**

`src/auth/guards/roles.guard.ts`:
```ts
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) return true;

        const { user } = context.switchToHttp().getRequest();

        if (!user || !requiredRoles.includes(user.userRole)) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}
```
`user.userRole` vem de `JwtStrategy.validate` (`{ userId, userRole }`).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest src/auth/guards/roles.guard.spec.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Helper de teste do `AuthService`**

`src/auth/testing/make-auth-service.ts`:
```ts
import { AuthService } from '../auth.service';
import { GenerateHashCodeProvider } from '../../shared/providers/generate-hash-code.provider';
import { DateHandlingProvider } from '../../shared/providers/date.provider';

export function makeAuthService() {
    const usersRepository = {
        findUserByEmail: jest.fn(),
        findUserById: jest.fn(),
        createUser: jest.fn(),
    };
    const encryptProvider = { compare: jest.fn(), encrypt: jest.fn() };
    const jwtService = { sign: jest.fn().mockReturnValue('signed-token') };
    const authRepository = {
        createRefreshToken: jest.fn(),
        findRefreshToken: jest.fn(),
        deleteRefreshToken: jest.fn(),
        updateRefreshToken: jest.fn(),
        createAuthCode: jest.fn(),
        findAuthCode: jest.fn(),
        deleteAuthCode: jest.fn(),
    };
    const logger = { log: jest.fn(), error: jest.fn() };

    const service = new AuthService(
        usersRepository as any,
        encryptProvider as any,
        jwtService as any,
        new GenerateHashCodeProvider(),
        authRepository as any,
        new DateHandlingProvider(),
        logger as any,
    );

    return { service, usersRepository, encryptProvider, jwtService, authRepository };
}
```

- [ ] **Step 6: Escrever os testes de role/validateUser**

`src/auth/auth.service.spec.ts`:
```ts
import { UnauthorizedException } from '@nestjs/common';
import { makeAuthService } from './testing/make-auth-service';

describe('AuthService — tokens and roles', () => {
    it('signs the token with the role stored on the user', async () => {
        const { service, usersRepository, jwtService } = makeAuthService();
        usersRepository.findUserById.mockResolvedValue({ id: 'u1', role: 'USER' });

        await service.generateToken('u1');

        expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'u1', role: 'USER' });
    });

    it('defaults a null role to USER', async () => {
        const { service, usersRepository, jwtService } = makeAuthService();
        usersRepository.findUserById.mockResolvedValue({ id: 'u1', role: null });

        await service.generateToken('u1');

        expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'u1', role: 'USER' });
    });

    it('validateUser returns null for accounts without a password (Google) without comparing', async () => {
        const { service, usersRepository, encryptProvider } = makeAuthService();
        usersRepository.findUserByEmail.mockResolvedValue({ id: 'u1', password: null });

        const result = await service.validateUser('a@b.com', 'whatever');

        expect(result).toBeNull();
        expect(encryptProvider.compare).not.toHaveBeenCalled();
    });

    it('refresh re-reads the role from the database, ignoring the role in the old token', async () => {
        const { service, usersRepository, authRepository, jwtService } = makeAuthService();
        authRepository.findRefreshToken.mockResolvedValue({
            id: 's1',
            expires_at: new Date(Date.now() + 60_000),
        });
        usersRepository.findUserById.mockResolvedValue({ id: 'u1', role: 'USER' });

        await service.generateRefreshToken(
            { refresh_token: 'abc' },
            { id: 'u1', role: 'ADMIN' },
        );

        expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'u1', role: 'USER' });
    });

    it('refresh fails when the user no longer exists', async () => {
        const { service, usersRepository, authRepository } = makeAuthService();
        authRepository.findRefreshToken.mockResolvedValue({
            id: 's1',
            expires_at: new Date(Date.now() + 60_000),
        });
        usersRepository.findUserById.mockResolvedValue(null);

        await expect(
            service.generateRefreshToken({ refresh_token: 'abc' }, { id: 'u1', role: 'USER' }),
        ).rejects.toThrow(UnauthorizedException);
    });
});
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `npx jest src/auth/auth.service.spec.ts`
Expected: FAIL — role assinada é `'ADMIN'`, `compare` é chamado com `null`, etc.

- [ ] **Step 8: Corrigir `auth.service.ts`**

1. Em `validateUser`, trocar `if (!user) return null;` por:
```ts
        if (!user || !user.password) return null;
```
2. Em `generateToken`, trocar
```ts
        const userRole = 'ADMIN';

        const token = await this.jwtService.sign({
            sub: user.id,
            role: userRole,
        });
```
por
```ts
        const token = await this.jwtService.sign({
            sub: user.id,
            role: user.role ?? 'USER',
        });
```
3. Em `generateRefreshToken`, trocar
```ts
        const userRole = 'ADMIN';

        const newToken = await this.jwtService.sign({
            sub: user.id,
            role: userRole,
        });
```
por
```ts
        const dbUser = await this.usersRepository.findUserById(user.id);

        if (!dbUser) {
            const error = new UnauthorizedException('User not found');
            this.logger.error(error.message);
            throw error;
        }

        const newToken = await this.jwtService.sign({
            sub: dbUser.id,
            role: dbUser.role ?? 'USER',
        });
```

- [ ] **Step 9: Rodar e ver passar**

Run: `npx jest src/auth`
Expected: PASS (guard + service).

- [ ] **Step 10: Commit**

```bash
git add src/auth/guards/roles.guard.ts src/auth/guards/roles.guard.spec.ts src/auth/testing src/auth/auth.service.spec.ts src/auth/auth.service.ts
git commit -m "fix(auth): add RolesGuard and stop issuing ADMIN role to every user

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Aplicar o guard e travar `/user`

**Files:**
- Create: `src/users/users-access.ts`, `src/users/users-access.spec.ts`
- Create: `src/users/dto/update-profile.dto.ts`
- Modify (reescrever): `src/users/users.controller.ts`, `src/category/category.controller.ts`, `src/league/league.controller.ts`, `src/coupon/coupon.controller.ts`

Regras: criar/editar/apagar categoria, liga, cupom = ADMIN. **Listar categorias e ligas é público** (o front precisa para filtros). Cupom inteiro continua ADMIN (a validação para o carrinho entra na Fase 4).

- [ ] **Step 1: Teste do helper de acesso**

`src/users/users-access.spec.ts`:
```ts
import { ForbiddenException } from '@nestjs/common';
import { assertSelfOrAdmin } from './users-access';

describe('assertSelfOrAdmin', () => {
    it('allows the user to access their own record', () => {
        expect(() => assertSelfOrAdmin({ userId: 'u1', userRole: 'USER' }, 'u1')).not.toThrow();
    });

    it('allows an admin to access any record', () => {
        expect(() => assertSelfOrAdmin({ userId: 'a1', userRole: 'ADMIN' }, 'u1')).not.toThrow();
    });

    it('forbids a regular user from accessing someone else', () => {
        expect(() => assertSelfOrAdmin({ userId: 'u2', userRole: 'USER' }, 'u1')).toThrow(
            ForbiddenException,
        );
    });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/users/users-access.spec.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

`src/users/users-access.ts`:
```ts
import { ForbiddenException } from '@nestjs/common';

export function assertSelfOrAdmin(
    user: { userId: string; userRole?: string },
    targetId: string,
): void {
    if (user.userRole === 'ADMIN' || user.userId === targetId) return;
    throw new ForbiddenException('You can only access your own account');
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest src/users/users-access.spec.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: DTO restrita de perfil**

`src/users/dto/update-profile.dto.ts` (sem `role`, `email` nem `password`; as DTOs antigas `UpdateUserDTO`/`CreateUserDTO` aceitam esses campos e não devem ser usadas em rotas de usuário comum):
```ts
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    firstName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    lastName?: string;

    @IsOptional()
    @IsString()
    picture?: string;

    @IsOptional()
    @IsString()
    document?: string;

    @IsOptional()
    @IsString()
    phone?: string;
}
```

- [ ] **Step 6: Reescrever `users.controller.ts`**

Removido: o `@Get(':email')` duplicado (rota inalcançável, sombreada por `:id`, com `@Param('id')` errado).
```ts
import {
    Body,
    Controller,
    Delete,
    Get,
    Injectable,
    Param,
    Patch,
    Req,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { assertSelfOrAdmin } from './users-access';

@Injectable()
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @Roles('ADMIN')
    findAll() {
        return this.usersService.findAllUsers();
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Req() req) {
        assertSelfOrAdmin(req.user, id);
        return this.usersService.findUserById(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
        data: UpdateProfileDto,
        @Req() req,
    ) {
        assertSelfOrAdmin(req.user, id);
        return this.usersService.updateUser(id, data);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Req() req) {
        assertSelfOrAdmin(req.user, id);
        return this.usersService.deleteUser(id);
    }
}
```

- [ ] **Step 7: Reescrever `category.controller.ts`**

```ts
import {
    Body,
    Controller,
    Delete,
    Get,
    Injectable,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryInput } from './input/update-category.input';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Injectable()
@Controller('category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    create(@Body() data: CreateCategoryDto) {
        return this.categoryService.createCategory(data);
    }

    @Get()
    findAll() {
        return this.categoryService.findAllCategories();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.categoryService.findOneCategory(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() data: UpdateCategoryInput) {
        return this.categoryService.updateCategory(id, data);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    delete(@Param('id') id: string) {
        return this.categoryService.deleteCategory(id);
    }
}
```

- [ ] **Step 8: Reescrever `league.controller.ts`**

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueInput } from './input/update-league.input';
import { LeagueService } from './league.service';

@Injectable()
@Controller('league')
export class LeagueController {
  constructor(private readonly leagueService: LeagueService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() data: CreateLeagueDto) {
    return this.leagueService.createLeague(data);
  }

  @Get()
  findAll() {
    return this.leagueService.findAllLeagues();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leagueService.findOneLeague(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() data: UpdateLeagueInput) {
    return this.leagueService.updateLeague(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.leagueService.deleteLeague(id);
  }
}
```

- [ ] **Step 9: `coupon.controller.ts` — acrescentar o guard**

No arquivo atual, trocar o import e os decorators de classe:
```ts
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
```
e
```ts
@Injectable()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('coupon')
```
(O resto do arquivo permanece igual.)

- [ ] **Step 10: Compilar e testar**

```bash
npx nest build
npx jest
```
Expected: build sem erro; todos os testes passam.

- [ ] **Step 11: Commit**

```bash
git add src/users src/category/category.controller.ts src/league/league.controller.ts src/coupon/coupon.controller.ts
git commit -m "fix(security): enforce ADMIN role on mutations and lock down /user

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Cadastro (`POST /auth/register`)

**Files:**
- Create: `src/auth/dto/register.dto.ts`
- Create: `src/auth/auth.service.register.spec.ts`
- Modify: `src/auth/auth.service.ts`
- Modify: `src/auth/auth.controller.ts`

- [ ] **Step 1: Teste**

`src/auth/auth.service.register.spec.ts`:
```ts
import { ConflictException } from '@nestjs/common';
import { makeAuthService } from './testing/make-auth-service';

describe('AuthService.register', () => {
    const input = {
        email: 'ana@example.com',
        password: 'Senha@1234',
        firstName: 'Ana',
        lastName: 'Silva',
    };

    it('creates a USER with a hashed password and returns tokens without the password', async () => {
        const { service, usersRepository, encryptProvider } = makeAuthService();
        usersRepository.findUserByEmail.mockResolvedValue(null);
        encryptProvider.encrypt.mockResolvedValue('hashed');
        const created = { id: 'u1', ...input, password: 'hashed', role: 'USER' };
        usersRepository.createUser.mockResolvedValue(created);
        usersRepository.findUserById.mockResolvedValue(created);

        const result = await service.register(input);

        expect(encryptProvider.encrypt).toHaveBeenCalledWith('Senha@1234', 10);
        expect(usersRepository.createUser).toHaveBeenCalledWith({
            email: 'ana@example.com',
            password: 'hashed',
            firstName: 'Ana',
            lastName: 'Silva',
            role: 'USER',
        });
        expect(result.token).toBe('signed-token');
        expect(result.refresh_token).toEqual(expect.any(String));
        expect(result.user.password).toBeUndefined();
    });

    it('rejects an email that is already registered', async () => {
        const { service, usersRepository } = makeAuthService();
        usersRepository.findUserByEmail.mockResolvedValue({ id: 'u9' });

        await expect(service.register(input)).rejects.toThrow(ConflictException);
        expect(usersRepository.createUser).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/auth/auth.service.register.spec.ts`
Expected: FAIL — `service.register is not a function` (erro de tipo do ts-jest).

- [ ] **Step 3: Implementar `register`**

Em `src/auth/auth.service.ts`, acrescentar `ConflictException` ao import de `@nestjs/common` e este método depois de `validateUser`:
```ts
    async register(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }) {
        const existing = await this.usersRepository.findUserByEmail(data.email);

        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const password = await this.encryptProvider.encrypt(data.password, 10);

        const user = await this.usersRepository.createUser({
            email: data.email,
            password,
            firstName: data.firstName,
            lastName: data.lastName,
            role: 'USER',
        });

        const { token, refresh_token } = await this.generateToken(user.id);

        return {
            user: { ...user, password: undefined },
            token,
            refresh_token,
        };
    }
```

- [ ] **Step 4: DTO**

`src/auth/dto/register.dto.ts` (72 = limite de bytes do bcrypt):
```ts
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    password: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;
}
```

- [ ] **Step 5: Endpoint**

Em `src/auth/auth.controller.ts`, importar `ValidationPipe` de `@nestjs/common` e `RegisterDto` de `./dto/register.dto`, e acrescentar antes de `@UseGuards(JwtRefreshGuard)`:
```ts
    @Post('register')
    async register(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
        data: RegisterDto,
    ) {
        return this.authService.register(data);
    }
```
`forbidNonWhitelisted` faz um body com `role: "ADMIN"` retornar 400.

- [ ] **Step 6: Rodar**

```bash
npx jest src/auth
npx nest build
```
Expected: PASS; build sem erro.

- [ ] **Step 7: Commit**

```bash
git add src/auth/dto/register.dto.ts src/auth/auth.service.register.spec.ts src/auth/auth.service.ts src/auth/auth.controller.ts
git commit -m "feat(auth): add public registration endpoint

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Login com Google entregando tokens (código de uso único)

Fluxo: Google → `GET /auth/google/callback` cria um código aleatório de uso único (guardado como hash SHA-256, validade de 1 min) e redireciona para `${FRONTEND_URL}/auth/google/callback?code=...`. O front troca o código por tokens em `POST /auth/google/exchange`. Tokens nunca aparecem na URL.

**Files:**
- Create: `src/auth/dto/exchange-code.dto.ts`
- Create: `src/auth/auth.service.google.spec.ts`
- Modify: `src/auth/repository/auth.repository.ts`, `src/auth/auth.service.ts`, `src/auth/auth.controller.ts`

- [ ] **Step 1: Testes**

`src/auth/auth.service.google.spec.ts`:
```ts
import { createHash } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { makeAuthService } from './testing/make-auth-service';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

describe('AuthService — Google auth code', () => {
    it('stores only the hash of the code and returns the plain code', async () => {
        const { service, authRepository } = makeAuthService();

        const code = await service.createGoogleAuthCode('u1');

        expect(code).toMatch(/^[0-9a-f]{64}$/);
        expect(authRepository.createAuthCode).toHaveBeenCalledWith({
            code_hash: sha256(code),
            user_id: 'u1',
            expires_at: expect.any(Date),
        });
    });

    it('exchanges a valid code for tokens and consumes it', async () => {
        const { service, authRepository, usersRepository } = makeAuthService();
        const user = { id: 'u1', role: 'USER', password: null };
        authRepository.findAuthCode.mockResolvedValue({
            id: 'c1',
            user_id: 'u1',
            expires_at: new Date(Date.now() + 30_000),
        });
        authRepository.deleteAuthCode.mockResolvedValue(true);
        usersRepository.findUserById.mockResolvedValue(user);

        const result = await service.exchangeGoogleAuthCode('abcd');

        expect(authRepository.findAuthCode).toHaveBeenCalledWith(sha256('abcd'));
        expect(authRepository.deleteAuthCode).toHaveBeenCalledWith('c1');
        expect(result.token).toBe('signed-token');
        expect(result.user.id).toBe('u1');
    });

    it('rejects an unknown code', async () => {
        const { service, authRepository } = makeAuthService();
        authRepository.findAuthCode.mockResolvedValue(null);

        await expect(service.exchangeGoogleAuthCode('nope')).rejects.toThrow(
            UnauthorizedException,
        );
    });

    it('rejects an expired code (and still deletes it)', async () => {
        const { service, authRepository } = makeAuthService();
        authRepository.findAuthCode.mockResolvedValue({
            id: 'c1',
            user_id: 'u1',
            expires_at: new Date(Date.now() - 1000),
        });
        authRepository.deleteAuthCode.mockResolvedValue(true);

        await expect(service.exchangeGoogleAuthCode('old')).rejects.toThrow(
            UnauthorizedException,
        );
        expect(authRepository.deleteAuthCode).toHaveBeenCalledWith('c1');
    });

    it('rejects a replayed code (delete reports nothing removed)', async () => {
        const { service, authRepository } = makeAuthService();
        authRepository.findAuthCode.mockResolvedValue({
            id: 'c1',
            user_id: 'u1',
            expires_at: new Date(Date.now() + 30_000),
        });
        authRepository.deleteAuthCode.mockResolvedValue(false);

        await expect(service.exchangeGoogleAuthCode('dup')).rejects.toThrow(
            UnauthorizedException,
        );
    });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/auth/auth.service.google.spec.ts`
Expected: FAIL — métodos inexistentes.

- [ ] **Step 3: Repositório**

Em `src/auth/repository/auth.repository.ts`, acrescentar dentro da classe, depois de `updateRefreshToken`:
```ts
    async createAuthCode(input: {
        code_hash: string;
        user_id: string;
        expires_at: Date;
    }): Promise<void> {
        await this.prisma.authCode.create({ data: input });
    }

    async findAuthCode(code_hash: string) {
        return this.prisma.authCode.findUnique({ where: { code_hash } });
    }

    async deleteAuthCode(id: string): Promise<boolean> {
        const { count } = await this.prisma.authCode.deleteMany({ where: { id } });
        return count === 1;
    }
```

- [ ] **Step 4: Service**

Em `src/auth/auth.service.ts`: adicionar `import { createHash } from 'crypto';` no topo; **remover** o método `googleLogin` (devolvia JSON sem token); acrescentar no fim da classe:
```ts
    private hashCode(code: string): string {
        return createHash('sha256').update(code).digest('hex');
    }

    async createGoogleAuthCode(userId: string): Promise<string> {
        const code = this.generateHashCodeProvider.generate(32);

        await this.authRepository.createAuthCode({
            code_hash: this.hashCode(code),
            user_id: userId,
            expires_at: this.dateHandlingProvider.addMinutes(new Date(), 1),
        });

        return code;
    }

    async exchangeGoogleAuthCode(code: string) {
        const record = await this.authRepository.findAuthCode(this.hashCode(code));

        if (!record) {
            throw new UnauthorizedException('Invalid code');
        }

        const consumed = await this.authRepository.deleteAuthCode(record.id);
        const expired = this.dateHandlingProvider.isAfter(
            new Date(),
            record.expires_at,
        );

        if (!consumed || expired) {
            throw new UnauthorizedException('Invalid code');
        }

        const user = await this.usersRepository.findUserById(record.user_id);
        const { token, refresh_token } = await this.generateToken(record.user_id);

        return {
            user: { ...user, password: undefined },
            token,
            refresh_token,
        };
    }
```

- [ ] **Step 5: DTO**

`src/auth/dto/exchange-code.dto.ts`:
```ts
import { IsHexadecimal, Length } from 'class-validator';

export class ExchangeCodeDto {
    @IsHexadecimal()
    @Length(64, 64)
    code: string;
}
```

Atenção: o teste de troca usa o código `'abcd'` direto no service (sem passar pela DTO), então o `Length(64)` só vale na borda HTTP.

- [ ] **Step 6: Controller**

Em `src/auth/auth.controller.ts`, importar `Res` de `@nestjs/common`, `import { Response } from 'express';` e `ExchangeCodeDto`. Substituir o handler `googleAuthRedirect` e acrescentar o de troca:
```ts
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req, @Res() res: Response) {
        const code = await this.authService.createGoogleAuthCode(req.user.id);
        res.redirect(
            `${process.env.FRONTEND_URL}/auth/google/callback?code=${code}`,
        );
    }

    @Post('google/exchange')
    async exchangeGoogleCode(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
        body: ExchangeCodeDto,
    ) {
        return this.authService.exchangeGoogleAuthCode(body.code);
    }
```

- [ ] **Step 7: Rodar**

```bash
npx jest src/auth
npx nest build
```
Expected: PASS (guard, tokens, register, google); build sem erro.

- [ ] **Step 8: Commit**

```bash
git add src/auth
git commit -m "feat(auth): hand Google login to the frontend via one-time code

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Produtos públicos com ofertas, busca, filtros e imagens

**Files:**
- Create: `src/product/product.mapper.ts`, `src/product/product.mapper.spec.ts`
- Create: `src/product/dto/product-query.dto.ts`, `src/product/dto/product-query.dto.spec.ts`
- Modify (reescrever): `src/product/repository/product.repository.ts`, `src/product/product.controller.ts`, `src/product/use-cases/find-all-products.use-case.ts`, `find-products-by-id.use-case.ts`, `find-products-by-category.use-case.ts`, `find-products-by-league.use-case.ts`
- Modify: `src/product/product.service.ts`, `src/product/dto/create-product.dto.ts`, `src/product/input/create-product.input.ts`, `src/product/input/update-product.input.ts`

- [ ] **Step 1: Instalar `class-transformer`**

```bash
npm install class-transformer
```

- [ ] **Step 2: Teste do mapper de desconto**

`src/product/product.mapper.spec.ts`:
```ts
import { withDiscount } from './product.mapper';

describe('withDiscount', () => {
    it('computes a rounded percentage when originalPrice is above price', () => {
        const result = withDiscount({ id: 'p1', price: 69.9, originalPrice: 139.9 });
        expect(result.isOnSale).toBe(true);
        expect(result.discountPercent).toBe(50);
    });

    it('rounds 159.9 vs 199.9 to 20%', () => {
        expect(withDiscount({ price: 159.9, originalPrice: 199.9 }).discountPercent).toBe(20);
    });

    it('is not on sale without an originalPrice', () => {
        const result = withDiscount({ price: 149.9, originalPrice: null });
        expect(result.isOnSale).toBe(false);
        expect(result.discountPercent).toBeNull();
    });

    it('is not on sale when originalPrice is not above price', () => {
        const result = withDiscount({ price: 100, originalPrice: 100 });
        expect(result.isOnSale).toBe(false);
        expect(result.discountPercent).toBeNull();
    });

    it('keeps the remaining fields untouched', () => {
        expect(withDiscount({ id: 'p1', name: 'X', price: 10 }).name).toBe('X');
    });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx jest src/product/product.mapper.spec.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 4: Implementar o mapper**

`src/product/product.mapper.ts`:
```ts
export function withDiscount<
    T extends { price: number; originalPrice?: number | null },
>(product: T) {
    const { price, originalPrice } = product;
    const isOnSale = originalPrice != null && originalPrice > price;
    const discountPercent = isOnSale
        ? Math.round((1 - price / originalPrice) * 100)
        : null;

    return { ...product, isOnSale, discountPercent };
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx jest src/product/product.mapper.spec.ts`
Expected: PASS (5 testes).

- [ ] **Step 6: Teste da DTO de consulta**

`src/product/dto/product-query.dto.spec.ts`:
```ts
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProductQueryDto } from './product-query.dto';

const parse = (plain: object) => plainToInstance(ProductQueryDto, plain);

describe('ProductQueryDto', () => {
    it('applies defaults (page 1, limit 20)', async () => {
        const dto = parse({});
        expect(await validate(dto)).toHaveLength(0);
        expect(dto.page).toBe(1);
        expect(dto.limit).toBe(20);
    });

    it('coerces numeric strings and the onSale flag', async () => {
        const dto = parse({ page: '2', limit: '10', onSale: 'true' });
        expect(await validate(dto)).toHaveLength(0);
        expect(dto.page).toBe(2);
        expect(dto.limit).toBe(10);
        expect(dto.onSale).toBe(true);
    });

    it('rejects a limit above 50', async () => {
        expect(await validate(parse({ limit: '100' }))).not.toHaveLength(0);
    });

    it('rejects page 0', async () => {
        expect(await validate(parse({ page: '0' }))).not.toHaveLength(0);
    });
});
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `npx jest src/product/dto/product-query.dto.spec.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 8: Implementar a DTO**

`src/product/dto/product-query.dto.ts`:
```ts
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ProductQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit: number = 20;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    onSale?: boolean;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsString()
    leagueId?: string;
}
```

- [ ] **Step 9: Rodar e ver passar**

Run: `npx jest src/product/dto`
Expected: PASS (4 testes).

- [ ] **Step 10: Campo `originalPrice` em criar/atualizar**

`src/product/dto/create-product.dto.ts`: depois do campo `price`, acrescentar
```ts
    @IsOptional()
    @IsNumber()
    originalPrice?: number;
```
`src/product/input/create-product.input.ts`: depois de `price: number;` acrescentar `originalPrice?: number | null;`.
`src/product/input/update-product.input.ts`: depois de `price?: number | null;` acrescentar `originalPrice?: number | null;`.

- [ ] **Step 11: Reescrever o repositório**

`src/product/repository/product.repository.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/databases/prisma.database';
import { CreateProductInput } from '../input/create-product.input';
import { UpdateProductInput } from '../input/update-product.input';
import { ProductQueryDto } from '../dto/product-query.dto';

const productSelect = {
    id: true,
    name: true,
    size: true,
    description: true,
    price: true,
    originalPrice: true,
    stock_status: true,
    Category: { select: { id: true, name: true } },
    League: { select: { id: true, name: true } },
    Images: {
        select: { id: true, url: true, is_Cover: true },
        orderBy: { is_Cover: 'desc' as const },
    },
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createProduct(data: CreateProductInput) {
        try {
            const product = this.prisma.product.create({
                data: {
                    name: data.name,
                    size: data.size,
                    description: data.description,
                    price: Number(data.price),
                    originalPrice:
                        data.originalPrice != null ? Number(data.originalPrice) : null,
                    stock_status: data.stock_status,
                    category_id: data.category_id,
                    league_id: data.league_id,
                },
            });
            return product;
        } catch (error) {
            console.error(error);
        }
    }

    async findProductsByCategory(category_id: string) {
        return this.prisma.product.findMany({
            where: { category_id },
            select: productSelect,
            orderBy: { name: 'asc' },
        });
    }

    async findProductsByLeague(league_id: string) {
        return this.prisma.product.findMany({
            where: { league_id },
            select: productSelect,
            orderBy: { name: 'asc' },
        });
    }

    async findProductsById(id: string) {
        return this.prisma.product.findUnique({
            where: { id },
            select: productSelect,
        });
    }

    async findAllProducts(query: ProductQueryDto) {
        const { page, limit, search, onSale, categoryId, leagueId } = query;

        const where: Prisma.ProductWhereInput = {
            ...(search && { name: { contains: search, mode: 'insensitive' } }),
            ...(categoryId && { category_id: categoryId }),
            ...(leagueId && { league_id: leagueId }),
            ...(onSale && {
                originalPrice: { not: null },
                price: { lt: this.prisma.product.fields.originalPrice },
            }),
        };

        const [products, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                where,
                select: productSelect,
                orderBy: { name: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.product.count({ where }),
        ]);

        return { products, total };
    }

    async updateProduct(id: string, data: UpdateProductInput) {
        try {
            const product = await this.prisma.product.update({
                where: { id },
                data: {
                    name: data.name,
                    size: data.size,
                    description: data.description,
                    price: data.price,
                    originalPrice: data.originalPrice,
                    stock_status: data.stock_status,
                    category_id: data.category_id,
                    league_id: data.league_id,
                },
            });
            return product;
        } catch (error) {
            console.error(error);
        }
    }

    async deleteProduct(id: string) {
        try {
            const product = this.prisma.product.delete({ where: { id } });
            return product;
        } catch (error) {
            console.error(error);
        }
    }
}
```

- [ ] **Step 12: Reescrever os use-cases de leitura**

`src/product/use-cases/find-all-products.use-case.ts`:
```ts
import { Injectable, Logger } from '@nestjs/common';
import { ProductsRepository } from '../repository/product.repository';
import { ProductQueryDto } from '../dto/product-query.dto';
import { withDiscount } from '../product.mapper';

@Injectable()
export class FindAllProductsUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(FindAllProductsUseCase.name),
    ) {}

    async execute(query: ProductQueryDto) {
        const { products, total } =
            await this.productsRepository.findAllProducts(query);

        this.logger.log('Products found', FindAllProductsUseCase.name);

        return {
            products: products.map(withDiscount),
            info: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }
}
```
`src/product/use-cases/find-products-by-id.use-case.ts` (remove o `try/catch` que embrulhava o 404 em outro 404 genérico):
```ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from '../repository/product.repository';
import { withDiscount } from '../product.mapper';

@Injectable()
export class FindProductByIdUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(FindProductByIdUseCase.name),
    ) {}

    async execute(id: string) {
        const product = await this.productsRepository.findProductsById(id);

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        this.logger.log('Product found', FindProductByIdUseCase.name);
        return { product: withDiscount(product) };
    }
}
```
`src/product/use-cases/find-products-by-category.use-case.ts`:
```ts
import { Injectable, Logger } from '@nestjs/common';
import { ProductsRepository } from '../repository/product.repository';
import { withDiscount } from '../product.mapper';

@Injectable()
export class FindProductByCategoryUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(
            FindProductByCategoryUseCase.name,
        ),
    ) {}

    async execute(categoryId: string) {
        const products =
            await this.productsRepository.findProductsByCategory(categoryId);

        this.logger.log('Products found', FindProductByCategoryUseCase.name);
        return products.map(withDiscount);
    }
}
```
`src/product/use-cases/find-products-by-league.use-case.ts`:
```ts
import { Injectable, Logger } from '@nestjs/common';
import { ProductsRepository } from '../repository/product.repository';
import { withDiscount } from '../product.mapper';

@Injectable()
export class FindProductByLeagueUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(
            FindProductByLeagueUseCase.name,
        ),
    ) {}

    async execute(leagueId: string) {
        const products =
            await this.productsRepository.findProductsByLeague(leagueId);

        this.logger.log('Products found', FindProductByLeagueUseCase.name);
        return products.map(withDiscount);
    }
}
```

- [ ] **Step 13: Service**

Em `src/product/product.service.ts`: trocar `import { PaginationParams } from './input/pagination-params.input';` por `import { ProductQueryDto } from './dto/product-query.dto';` e o método por:
```ts
    async findAllProducts(query: ProductQueryDto) {
        return await this.findAllProductsUseCase.execute(query);
    }
```

- [ ] **Step 14: Reescrever o controller (GETs públicos, escrita só ADMIN)**

`src/product/product.controller.ts`:
```ts
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductInput } from './input/update-product.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async create(
        @Body(new ValidationPipe({ whitelist: true })) data: CreateProductDto,
    ) {
        return this.productService.createProduct(data);
    }

    @Get()
    findAll(
        @Query(new ValidationPipe({ transform: true, whitelist: true }))
        query: ProductQueryDto,
    ) {
        return this.productService.findAllProducts(query);
    }

    @Get('league/:league_id')
    findAllProductsByLeague(@Param('league_id') id: string) {
        return this.productService.findAllProductsByLeague(id);
    }

    @Get('category/:category_id')
    findAllProductsByCategory(@Param('category_id') id: string) {
        return this.productService.findProductsByCategory(id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productService.findProductById(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async update(@Param('id') id: string, @Body() data: UpdateProductInput) {
        return this.productService.updateProduct(id, data);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.productService.deleteProduct(id);
    }
}
```

- [ ] **Step 15: Compilar e testar**

```bash
npx nest build
npx jest
grep -rn "from 'src/" src
```
Expected: build sem erro (se `prisma.product.fields.originalPrice` não existir na versão instalada, o erro aparece aqui: nesse caso trocar o filtro `onSale` por `originalPrice: { not: null }` e filtrar `price < originalPrice` com `$queryRaw`, e informar ao usuário); todos os testes passam; `grep` sem resultados.

- [ ] **Step 16: Commit**

```bash
git add package.json package-lock.json src/product
git commit -m "feat(product): public catalog with offers, search, filters and images

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: CORS e porta

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Reescrever `main.ts`**

(O `rawBody: true` necessário para o webhook da Stripe entra na Fase 4.)
```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: (process.env.FRONTEND_URL ?? 'http://localhost:3001').split(','),
        credentials: true,
    });

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- [ ] **Step 2: Compilar**

Run: `npx nest build`
Expected: sem erro.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat(api): enable CORS for the frontend origin and honor PORT

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Seed de demonstração

**Files:**
- Modify (reescrever): `prisma/seed.ts`

As imagens ficam no front (`public/products/`, criadas na Fase 2 a partir de `Torcida Veste/images/`: `bayern-shirt.png`, `conjunto.png`, `pro-socks.png`). O campo `Image.url` guarda o caminho público (`/products/...`). O seed é idempotente (pode rodar várias vezes).

- [ ] **Step 1: Reescrever `prisma/seed.ts`**

```ts
import { PrismaClient, STOCK_STATUS } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CATEGORIES = [
    { id: 'seed-category-camisetas', name: 'camisetas' },
    { id: 'seed-category-conjuntos', name: 'conjuntos' },
    { id: 'seed-category-pro-socks', name: 'pro socks' },
];

const LEAGUE = { id: 'seed-league-bundesliga', name: 'Bundesliga' };

type SeedProduct = {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    categoryId: string;
    image: string;
    description: string;
};

const SHIRT = {
    categoryId: 'seed-category-camisetas',
    image: '/products/bayern-shirt.png',
    description:
        'Camisa inspirada no uniforme do Bayern de Munique. Tecido leve e respirável, ideal para torcer nos dias de jogo.',
};
const SET = {
    categoryId: 'seed-category-conjuntos',
    image: '/products/conjunto.png',
    description:
        'Conjunto de treino completo (jaqueta e calça) inspirado no Bayern de Munique. Confortável para o dia a dia.',
};
const SOCKS = {
    categoryId: 'seed-category-pro-socks',
    image: '/products/pro-socks.png',
    description:
        'Meiões profissionais com reforço no calcanhar e na sola, para jogar e torcer com conforto.',
};

const PRODUCTS: SeedProduct[] = [
    { id: 'seed-product-01', name: 'Camiseta Bayern de Munique Home 14/15', price: 69.9, originalPrice: 139.9, ...SHIRT },
    { id: 'seed-product-02', name: 'Camiseta Bayern de Munique Away 14/15', price: 69.9, originalPrice: 139.9, ...SHIRT },
    { id: 'seed-product-03', name: 'Camiseta Bayern de Munique Third 14/15', price: 69.9, originalPrice: 139.9, ...SHIRT },
    { id: 'seed-product-04', name: 'Camiseta Bayern de Munique Retrô', price: 69.9, originalPrice: 139.9, ...SHIRT },
    { id: 'seed-product-05', name: 'Camiseta Bayern de Munique Goleiro', price: 69.9, originalPrice: 139.9, ...SHIRT },
    { id: 'seed-product-06', name: 'Camiseta Bayern de Munique Treino', price: 149.9, ...SHIRT },
    { id: 'seed-product-07', name: 'Camiseta Bayern de Munique Torcedor', price: 149.9, ...SHIRT },
    { id: 'seed-product-08', name: 'Camiseta Bayern de Munique Edição Especial', price: 149.9, ...SHIRT },
    { id: 'seed-product-09', name: 'Conjunto Bayern de Munique Treino', price: 159.9, originalPrice: 199.9, ...SET },
    { id: 'seed-product-10', name: 'Conjunto Bayern de Munique Viagem', price: 159.9, originalPrice: 199.9, ...SET },
    { id: 'seed-product-11', name: 'Conjunto Bayern de Munique Aquecimento', price: 199.9, ...SET },
    { id: 'seed-product-12', name: 'Conjunto Bayern de Munique Inverno', price: 199.9, ...SET },
    { id: 'seed-product-13', name: 'Conjunto Bayern de Munique Casual', price: 199.9, ...SET },
    { id: 'seed-product-14', name: 'Pro Socks Preto', price: 29.9, originalPrice: 39.9, ...SOCKS },
    { id: 'seed-product-15', name: 'Pro Socks Branco', price: 29.9, originalPrice: 39.9, ...SOCKS },
    { id: 'seed-product-16', name: 'Pro Socks Vermelho', price: 39.9, ...SOCKS },
    { id: 'seed-product-17', name: 'Pro Socks Azul', price: 39.9, ...SOCKS },
];

async function seedUsers() {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME } =
        process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
    }

    await prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: {},
        create: {
            email: ADMIN_EMAIL,
            password: await bcrypt.hash(ADMIN_PASSWORD, 10),
            role: 'ADMIN',
            firstName: ADMIN_FIRST_NAME ?? 'Admin',
            lastName: ADMIN_LAST_NAME ?? 'Torcida',
            picture: process.env.ADMIN_PICTURE,
        },
    });

    // Conta pública de demonstração para o portfólio (role USER).
    await prisma.user.upsert({
        where: { email: 'demo@torcidaveste.com' },
        update: {},
        create: {
            email: 'demo@torcidaveste.com',
            password: await bcrypt.hash('Demo@1234', 10),
            role: 'USER',
            firstName: 'Demo',
            lastName: 'Torcedor',
        },
    });
}

async function seedCatalog() {
    for (const category of CATEGORIES) {
        await prisma.category.upsert({
            where: { id: category.id },
            update: { name: category.name },
            create: category,
        });
    }

    await prisma.league.upsert({
        where: { id: LEAGUE.id },
        update: { name: LEAGUE.name },
        create: LEAGUE,
    });

    for (const product of PRODUCTS) {
        const data = {
            name: product.name,
            size: 'P/M/G/GG',
            description: product.description,
            price: product.price,
            originalPrice: product.originalPrice ?? null,
            stock_status: STOCK_STATUS.IN_STOCK,
            category_id: product.categoryId,
            league_id: LEAGUE.id,
        };

        await prisma.product.upsert({
            where: { id: product.id },
            update: data,
            create: { id: product.id, ...data },
        });

        const imageId = `${product.id}-cover`;
        const imageData = {
            url: product.image,
            key: product.image.replace('/products/', ''),
            is_Cover: true,
            product_id: product.id,
        };

        await prisma.image.upsert({
            where: { id: imageId },
            update: imageData,
            create: { id: imageId, ...imageData },
        });
    }

    await prisma.coupon.upsert({
        where: { id: 'seed-coupon-torcida10' },
        update: {},
        create: {
            id: 'seed-coupon-torcida10',
            code: 'TORCIDA10',
            discount_type: 'PERCENTAGE',
            value: 10,
            expiration_at: '2099-12-31T23:59:59.000Z',
        },
    });
}

async function main() {
    await seedUsers();
    await seedCatalog();
    console.log('Seed completed.');
}

main()
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Rodar duas vezes (idempotência)**

```bash
npx prisma db seed
npx prisma db seed
```
Expected: `Seed completed.` nas duas execuções, sem erro de chave duplicada.

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(seed): idempotent demo catalog, demo user and coupon

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Verificação ponta a ponta da fase

**Files:** nenhum (só verificação).

- [ ] **Step 1: Subir a API**

```bash
npx nest build
node dist/main &
sleep 4
```
Expected: log `Nest application successfully started`. Se `node dist/main` falhar com `Cannot find module 'src/...'`, há import absoluto remanescente: corrigir (Task 1/7) antes de seguir. Guardar o PID para encerrar no fim (`kill %1`).

- [ ] **Step 2: Catálogo público (sem token)**

```bash
curl -s "localhost:3000/product?limit=3" | head -c 700; echo
curl -s "localhost:3000/product?onSale=true&limit=50" | grep -o '"total":[0-9]*'
curl -s "localhost:3000/product?search=conjunto" | grep -o '"total":[0-9]*'
curl -s -o /dev/null -w "%{http_code}\n" "localhost:3000/product?limit=100"
curl -s localhost:3000/category | head -c 300; echo
```
Expected: produtos com `Images`, `isOnSale`, `discountPercent`; `onSale` com `"total":9` (5 camisetas + 2 conjuntos + 2 pro socks em oferta no seed); busca por "conjunto" com `"total":5`; `limit=100` → `400`; categorias listadas sem token.

- [ ] **Step 3: Segurança de papéis**

```bash
# cadastro
curl -s -X POST localhost:3000/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"teste@example.com","password":"Senha@1234","firstName":"Teste","lastName":"Usuario"}' | head -c 400; echo
# tentativa de escalar para admin
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"x@example.com","password":"Senha@1234","firstName":"X","lastName":"Y","role":"ADMIN"}'
# login e uso do token de USER
TOKEN=$(curl -s -X POST localhost:3000/auth -H 'Content-Type: application/json' \
  -d '{"email":"teste@example.com","password":"Senha@1234"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')
curl -s -o /dev/null -w "criar produto como USER: %{http_code}\n" -X POST localhost:3000/product \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{}'
curl -s -o /dev/null -w "listar usuarios como USER: %{http_code}\n" localhost:3000/user -H "Authorization: Bearer $TOKEN"
curl -s -o /dev/null -w "criar categoria como USER: %{http_code}\n" -X POST localhost:3000/category \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"name":"x"}'
```
Expected: cadastro retorna `user`, `token`, `refresh_token` e **sem** `password`; registro com `role` → `400`; os três últimos → `403`.

- [ ] **Step 4: Admin consegue**

```bash
ADMIN_TOKEN=$(curl -s -X POST localhost:3000/auth -H 'Content-Type: application/json' \
  -d "{\"email\":\"$(grep ^ADMIN_EMAIL .env | cut -d= -f2-)\",\"password\":\"$(grep ^ADMIN_PASSWORD .env | cut -d= -f2-)\"}" | sed -E 's/.*"token":"([^"]+)".*/\1/')
curl -s -o /dev/null -w "listar usuarios como ADMIN: %{http_code}\n" localhost:3000/user -H "Authorization: Bearer $ADMIN_TOKEN"
```
Expected: `200`. (Se o `.env` usar aspas nos valores, ajustar o `cut`.)

- [ ] **Step 5: Google (manual, depende de credenciais do usuário)**

Se o usuário já tiver `GOOGLE_CLIENT_ID/SECRET` no `.env` e o redirect `http://localhost:3000/auth/google/callback` cadastrado no Google Cloud, abrir `http://localhost:3000/auth/google` no navegador: deve terminar em `http://localhost:3001/auth/google/callback?code=<64 hex>` (a página 404 do front é esperada, ele só existe na Fase 3). Trocar o código:
```bash
curl -s -X POST localhost:3000/auth/google/exchange -H 'Content-Type: application/json' -d '{"code":"<CODE>"}' | head -c 300; echo
```
Expected: `token`, `refresh_token`, `user`; repetir a mesma chamada → `401`. Se as credenciais não existirem ainda, registrar como "não verificado — depende de credenciais" no relatório final.

- [ ] **Step 6: Encerrar e rodar a suíte**

```bash
kill %1
npx jest
npx nest build
git status --short
```
Expected: todos os testes passam; build limpo; `git status` sem arquivos pendentes da fase.

- [ ] **Step 7: Relatório**

Resumir ao usuário: o que foi verificado (com as saídas acima), o que ficou sem verificar (Google, se aplicável) e os itens "fora desta fase" listados no topo (`/address` sem dono, use-cases sem `await`, repositórios engolindo erros). Perguntar se quer abrir PR ou seguir direto para o plano da Fase 2.

---

## Self-review (spec × plano)

| Requisito da spec | Task |
|---|---|
| 2.1 role hardcoded | 3 |
| 2.1 Google com código de uso único | 6 |
| 2.1 comparação de senha | 3 (`validateUser` sem senha) — a ordem dos argumentos de `compare(encrypted, plain)` confere com a assinatura do provider (`compare(encryptedValue, textPlain)`), então não havia bug de ordem, só o caso `null` |
| 2.2 `originalPrice`, desconto calculado | 2, 7 |
| 2.2 GET de produto públicos, escrita ADMIN | 7 |
| 2.2 `search`, `onSale`, `categoryId`, `leagueId`, paginação | 7 |
| 2.2 respostas com `Images`/`Category`/`League` | 7 |
| 2.4 CORS, `PORT` | 8 |
| 2.4 Prisma Postgres + migration inicial | 2 |
| 2.4 seed (categorias, produtos, imagens, cupom, admin, demo) | 9 |
| Cadastro (necessário ao front; implícito na spec) | 5 |
| Segurança de papéis/`/user` (achado novo, **não estava na spec**) | 3, 4 |
| 2.3 Pedidos/Stripe/webhook, `POST /coupon/validate` | **Fase 4** |
| Entrypoint Vercel, `postinstall: prisma generate`, Neon | **Fase 5** |
