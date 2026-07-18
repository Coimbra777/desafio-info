import { PaginatedDto, PaginationMetaDto } from "./paginated.dto";

export function buildMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMetaDto {
  const safeLimit = limit > 0 ? limit : 1;
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && total > 0,
  };
}

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedDto<T> {
  return {
    data,
    meta: buildMeta(total, page, limit),
  };
}
