import { buildMeta, paginate } from "./paginate";

describe("pagination helper", () => {
  it("computes meta for a middle page", () => {
    expect(buildMeta(50000, 2, 20)).toEqual({
      page: 2,
      limit: 20,
      total: 50000,
      totalPages: 2500,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it("marks the first page as having no previous", () => {
    const meta = buildMeta(100, 1, 20);

    expect(meta.hasPreviousPage).toBe(false);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.totalPages).toBe(5);
  });

  it("marks the last page as having no next", () => {
    const meta = buildMeta(100, 5, 20);

    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(true);
  });

  it("handles an empty result set", () => {
    expect(buildMeta(0, 1, 20)).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it("handles a page beyond the total", () => {
    const meta = buildMeta(30, 99, 20);

    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(true);
    expect(meta.totalPages).toBe(2);
  });

  it("wraps data and meta together", () => {
    const result = paginate([{ id: 1 }], 1, 1, 20);

    expect(result.data).toEqual([{ id: 1 }]);
    expect(result.meta.total).toBe(1);
  });
});
