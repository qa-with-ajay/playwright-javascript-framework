import dotenv from "dotenv";
import path from "node:path";

export function loadEnv(defaultEnvironment = "local") {
  const environment = process.env.ENV || process.env.ENVIRONMENT || defaultEnvironment;
  const envPath = path.resolve(process.cwd(), `.env.${environment}`);
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    if (result.error.code === "ENOENT") {
      console.warn(`[env] ${path.basename(envPath)} not found; using existing process environment variables.`);
    } else {
      throw result.error;
    }
  } else {
    console.info(`[env] Loaded ${path.basename(envPath)} (secret values are not logged).`);
  }

  return environment;
}