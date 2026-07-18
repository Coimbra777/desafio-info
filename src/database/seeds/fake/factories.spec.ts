import {
  buildBrandData,
  buildModelData,
  buildUserData,
  buildVehicleData,
  createFaker,
} from "./factories";

const SEED = 1337;
const MAX_YEAR = new Date().getFullYear() + 1;

describe("fake seed factories", () => {
  it("is deterministic for the same seed and index", () => {
    const a = buildUserData(createFaker(SEED), 1);
    const b = buildUserData(createFaker(SEED), 1);

    expect(a).toEqual(b);
  });

  it("produces different human data across indexes", () => {
    const faker = createFaker(SEED);
    const first = buildUserData(faker, 1);
    const second = buildUserData(faker, 2);

    expect(first.name).not.toEqual(second.name);
    expect(first.email).not.toEqual(second.email);
  });

  it("keeps user email and nickname unique across a range", () => {
    const faker = createFaker(SEED);
    const emails = new Set<string>();
    const nicknames = new Set<string>();

    for (let index = 1; index <= 500; index++) {
      const user = buildUserData(faker, index);
      emails.add(user.email);
      nicknames.add(user.nickname);
    }

    expect(emails.size).toBe(500);
    expect(nicknames.size).toBe(500);
  });

  it("keeps vehicle plate, chassis and renavam unique across a range", () => {
    const faker = createFaker(SEED);
    const plates = new Set<string>();
    const chassis = new Set<string>();
    const renavams = new Set<string>();

    for (let index = 1; index <= 500; index++) {
      const vehicle = buildVehicleData(faker, 1, index);
      plates.add(vehicle.licensePlate);
      chassis.add(vehicle.chassis);
      renavams.add(vehicle.renavam);
    }

    expect(plates.size).toBe(500);
    expect(chassis.size).toBe(500);
    expect(renavams.size).toBe(500);
  });

  it("generates a valid year and 11-digit renavam", () => {
    const faker = createFaker(SEED);

    for (let index = 1; index <= 100; index++) {
      const vehicle = buildVehicleData(faker, 1, index);
      expect(vehicle.year).toBeGreaterThanOrEqual(1900);
      expect(vehicle.year).toBeLessThanOrEqual(MAX_YEAR);
      expect(vehicle.renavam).toMatch(/^\d{11}$/);
    }
  });

  it("carries the given brandId and modelId into related entities", () => {
    const faker = createFaker(SEED);

    expect(buildBrandData(faker, 1).name).toEqual(expect.any(String));
    expect(buildModelData(faker, 42, 1).brandId).toBe(42);
    expect(buildVehicleData(faker, 7, 1).modelId).toBe(7);
  });
});
