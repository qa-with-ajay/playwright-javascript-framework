function parseBoolean(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return ["true", "1", "yes"].includes(String(value).toLowerCase());
}

function parsePositiveInteger(value, fallback, variableName) {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${variableName} must be a positive integer.`);
  }
  return parsed;
}

export function getConfig() {
  const baseURL = process.env.BASE_URL || process.env.ERP_BASE_URL || undefined;
  const apiURL = process.env.API_URL || process.env.ERP_API_URL || baseURL;
  const startWebServer = parseBoolean(process.env.START_WEB_SERVER, false);

  for (const [name, value] of [["BASE_URL", baseURL], ["API_URL", apiURL]]) {
    if (value) {
      try {
        new URL(value);
      } catch {
        throw new Error(`${name} must be a valid absolute URL. Received: ${value}`);
      }
    }
  }

  if (startWebServer && !baseURL) {
    throw new Error("BASE_URL is required when START_WEB_SERVER=true.");
  }

  return {
    baseURL,
    apiURL,
    timeout: parsePositiveInteger(process.env.TIMEOUT, 30_000, "TIMEOUT"),
    expectTimeout: parsePositiveInteger(process.env.EXPECT_TIMEOUT, 5_000, "EXPECT_TIMEOUT"),
    headless: parseBoolean(process.env.HEADLESS, true),
    startWebServer
  };
}

// Backward-compatible default export for existing tests and fixtures.
export default getConfig();