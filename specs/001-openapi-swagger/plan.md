# 001 — Plano técnico (Swagger)

Referência: [spec.md](spec.md) · [constituição](../000-constitution.md)

## Abordagem

Usar o pacote oficial **`@nestjs/swagger`**, que gera OpenAPI 3 a partir dos decorators do
Nest. O `CLI Plugin` do Swagger infere automaticamente muitos `@ApiProperty` a partir dos
tipos/validators dos DTOs, reduzindo anotação manual — habilitado em
[nest-cli.json](../../nest-cli.json).

## Dependências

```
npm i @nestjs/swagger
```

(`swagger-ui-express` entra como dependência transitiva do `@nestjs/swagger` v7+.)

## Mudanças por arquivo

### Bootstrap — [src/main.ts](../../src/main.ts)

- Adicionar setup do `DocumentBuilder`:
  - título "Aivacol Fleet Management API", versão a partir do `package.json`.
  - `.addBearerAuth()` com nome `access-token`.
- Montar em `/api/swagger` (UI) via `SwaggerModule.setup("api/swagger", ...)` — o
  `/api/swagger-json` é servido automaticamente pelo `SwaggerModule`.
- Guardar atrás de `SWAGGER_ENABLED !== "false"` (RNF3).

### CLI plugin — [nest-cli.json](../../nest-cli.json)

- Adicionar `"plugins": ["@nestjs/swagger"]` em `compilerOptions` para inferência
  automática de `@ApiProperty` a partir de tipos e do `class-validator`.

### Controllers (6)

Anotar cada controller com:

- `@ApiTags("<recurso>")` na classe.
- `@ApiBearerAuth("access-token")` nas classes protegidas (todas menos auth).
- Por endpoint: `@ApiOperation({ summary })` e `@ApiResponse`/atalhos
  (`@ApiCreatedResponse`, `@ApiOkResponse`, `@ApiNoContentResponse`,
  `@ApiConflictResponse`, `@ApiNotFoundResponse`, `@ApiBadRequestResponse`,
  `@ApiUnauthorizedResponse`) conforme as regras da spec (§ "Regras de negócio").

### DTOs de entrada

Com o CLI plugin ligado, tipos e validators já geram schema. Adicionar `@ApiProperty`
**apenas** onde exemplo/descrição agregam (ex.: `licensePlate` exemplo `"ABC1234"`,
`year` exemplo `2024`, `email` formato). DTOs opcionais (`Update*`) usam
`@ApiPropertyOptional`.

### DTOs de resposta (novos, só para doc)

Criar classes de resposta para o Swagger enxergar o shape retornado (services hoje
retornam objetos literais / entidades):

- `LoginResponseDto` (`accessToken`, `tokenType`).
- `UserResponseDto` (o shape do `toResponse`, **sem** `passwordHash`).
- `AuditLogResponseDto` (espelha `AuditLogResponse`).
- Entidades `Brand`/`Model`/`Vehicle` podem ser usadas diretamente como `type` das
  respostas, anotando seus campos com `@ApiProperty` (sem expor relações sensíveis).

> Importante (Artigo V.2): `UserResponseDto` **não** inclui `passwordHash`. Nunca anotar
> esse campo com `@ApiProperty`.

## Riscos e mitigações

| Risco                                             | Mitigação                                        |
| ------------------------------------------------- | ------------------------------------------------ |
| CLI plugin não inferir enums/tipos custom         | Anotar manualmente os poucos casos               |
| Expor `/docs` em produção sem querer              | Flag `SWAGGER_ENABLED` (RNF3), documentada       |
| Vazar `passwordHash` no schema de resposta        | DTO de resposta dedicado, sem o campo            |
| Divergência doc × comportamento                   | Doc gerada do código; e2e valida `paths`         |

## Verificação

1. `make up` → abrir `http://localhost:3000/api/swagger`.
2. Login pela UI, copiar token, "Authorize", executar `GET /vehicles`.
3. `curl localhost:3000/api/swagger-json | jq '.paths | keys'` mostra todos os recursos.
4. Rodar e2e novo (`make test-e2e`).
5. Validar o JSON em editor.swagger.io (sanidade do OpenAPI 3).

## Definição de pronto

Todos os critérios de aceite da spec marcados + e2e passando + `.env.example` atualizado
com `SWAGGER_ENABLED` + README/DOCUMENTACAO citando `/docs`.
