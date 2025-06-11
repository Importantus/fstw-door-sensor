function constructEnv(name: string, defaultOption: string = ""): string {
  const env = process.env[name];
  if (!env && !defaultOption) {
    throw new Error(`Environment variable ${name} not found`);
  }
  return env || defaultOption;
}

export const environment = {
  webhookUrl: constructEnv("WEBHOOK_URL", "http://localhost:3000/webhook"),
  signKey: constructEnv("SIGN_KEY", "default-sign-key"), // Secret key for signing payloads
  retryCount: parseInt(constructEnv("RETRY_COUNT", "3"), 10), // Number of retries for webhook requests
};
