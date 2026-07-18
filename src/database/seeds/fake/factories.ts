import { Faker, base, en, pt_BR } from "@faker-js/faker";

const MAX_VEHICLE_YEAR = new Date().getFullYear() + 1;
const RENAVAM_BASE = 90000000000;

/**
 * Instância determinística do faker (locale pt-BR com fallback en/base).
 * Semear com o mesmo valor produz sempre a mesma sequência de dados.
 */
export function createFaker(seed: number): Faker {
  const faker = new Faker({ locale: [pt_BR, en, base] });
  faker.seed(seed);
  return faker;
}

export interface FakeUserData {
  nickname: string;
  name: string;
  email: string;
}

export interface FakeBrandData {
  name: string;
}

export interface FakeModelData {
  name: string;
  brandId: number;
}

export interface FakeVehicleData {
  licensePlate: string;
  chassis: string;
  renavam: string;
  year: number;
  modelId: number;
}

/**
 * O `index` (1-based, estável) é embutido nas colunas únicas para garantir
 * unicidade entre execuções, enquanto o faker cuida da parte "humana".
 */
export function buildUserData(faker: Faker, index: number): FakeUserData {
  return {
    nickname: `demo-user-${index}`,
    name: faker.person.fullName(),
    email: `demo-user-${index}@demo.aivacol.dev`,
  };
}

export function buildBrandData(faker: Faker, index: number): FakeBrandData {
  return {
    name: `${faker.vehicle.manufacturer()} ${index}`,
  };
}

export function buildModelData(
  faker: Faker,
  brandId: number,
  index: number,
): FakeModelData {
  return {
    name: `${faker.vehicle.model()} ${index}`,
    brandId,
  };
}

export function buildVehicleData(
  faker: Faker,
  modelId: number,
  index: number,
): FakeVehicleData {
  const suffix = String(index).padStart(7, "0");

  return {
    licensePlate: `DEMO${suffix}`,
    chassis: `${faker.vehicle.vin()}${suffix}`,
    renavam: String(RENAVAM_BASE + index),
    year: faker.number.int({ min: 2005, max: MAX_VEHICLE_YEAR }),
    modelId,
  };
}
