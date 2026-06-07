import 'dotenv/config';
import { validateEnv } from '../../config/validation.config';

async function runSeeds(): Promise<void> {
  validateEnv(process.env);
  process.stdout.write('Seed bootstrap created. Business seeds will be implemented in the next phase.\n');
}

void runSeeds();
