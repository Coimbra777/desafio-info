import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 50000, description: "Total de registros do recurso" })
  total!: number;

  @ApiProperty({ example: 2500 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage!: boolean;
}

/**
 * Envelope padrão de resposta paginada. `data` é tipado como `unknown[]` aqui e
 * refinado por recurso via o decorator `ApiPaginatedResponse` no Swagger.
 */
export class PaginatedDto<T> {
  // `data` é documentado por recurso no decorator `ApiPaginatedResponse` (allOf).
  // Escondido aqui porque o tipo genérico T não é resolvível pelo plugin do Swagger
  // (geraria erro de dependência circular no boot).
  @ApiHideProperty()
  data!: T[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
