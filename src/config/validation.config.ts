import * as Joi from "joi";

const databaseEnvFields = {
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  PORT: Joi.number().port().default(3000),
  DB_HOST: Joi.string().hostname().required(),
  DB_PORT: Joi.number().port().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().min(8).required(),
  DB_DATABASE: Joi.string().required(),
  DB_ENCRYPT: Joi.boolean().required(),
  DB_TRUST_SERVER_CERTIFICATE: Joi.boolean().required(),
};

const seedEnvFields = {
  SEED_AIVACOL_EMAIL: Joi.string().email().required(),
  SEED_AIVACOL_PASSWORD: Joi.string().min(8).required(),
};

const appEnvSchema = Joi.object({
  ...databaseEnvFields,
  REDIS_HOST: Joi.string().hostname().required(),
  REDIS_PORT: Joi.number().port().required(),
  REDIS_PASSWORD: Joi.string().allow("").optional(),
  REDIS_DB: Joi.number().integer().min(0).required(),
  VEHICLES_CACHE_TTL: Joi.number().integer().min(1).required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  ...seedEnvFields,
})
  .unknown(true)
  .required();

const databaseEnvSchema = Joi.object({
  ...databaseEnvFields,
})
  .unknown(true)
  .required();

const seedEnvSchema = Joi.object({
  ...databaseEnvFields,
  ...seedEnvFields,
})
  .unknown(true)
  .required();

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const { error, value } = appEnvSchema.validate(config, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }

  return value;
}

export function validateDatabaseEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const { error, value } = databaseEnvSchema.validate(config, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }

  return value;
}

export function validateSeedEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const { error, value } = seedEnvSchema.validate(config, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }

  return value;
}
