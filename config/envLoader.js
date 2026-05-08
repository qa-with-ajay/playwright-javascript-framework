import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadEnv(envName) {
  const targetEnv = process.env.ENV || envName || 'qa';
  // Correct path resolution
  const envPath = resolve(__dirname, `./env/.env.${targetEnv}`);
  console.log(`Loading env file: ${envPath}`);
  dotenv.config({ path: envPath });
  console.log(`Running tests on environment: ${targetEnv}`);
}
