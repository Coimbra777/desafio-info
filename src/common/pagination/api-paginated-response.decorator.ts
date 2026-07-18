import { Type, applyDecorators } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { PaginatedDto, PaginationMetaDto } from "./paginated.dto";

/**
 * Documenta no Swagger o envelope paginado `{ data: Model[], meta }` para um recurso.
 */
export function ApiPaginatedResponse<TModel extends Type<unknown>>(
  model: TModel,
): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    ApiExtraModels(PaginatedDto, PaginationMetaDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedDto) },
          {
            properties: {
              data: {
                type: "array",
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
}
