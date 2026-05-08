export default {
  baseURL: process.env.BASE_URL,
  apiURL: process.env.API_URL,
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  timeout: Number(process.env.TIMEOUT) || 30000,
  headless: process.env.HEADLESS === 'true'
};
