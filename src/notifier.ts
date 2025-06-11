import { environment } from "./utils/environment";
import log, { Level, Scope } from "./utils/logger";
import { signPayload } from "./utils/signPayload";

export interface DoorState {
  open: boolean;
}

export class WebhookNotifier {
  private url = environment.webhookUrl;
  private retries = environment.retryCount;

  async notify(state: DoorState): Promise<void> {
    const timestamp = new Date().toISOString();
    const hmac = signPayload(state, timestamp);

    const headers = {
      "Content-Type": "application/json",
      "X-Signature": `sha256=${hmac}`,
      "X-Timestamp": timestamp,
    };

    const body = JSON.stringify(state);
    log(
      `Sending webhook notification to ${this.url} with state: ${JSON.stringify(
        state
      )}`,
      Scope.NETWORK,
      Level.INFO
    );
    await this.sendWithRetry(body, headers, this.retries);
  }

  private async sendWithRetry(
    body: string,
    headers: Record<string, string>,
    attemptsLeft: number,
    backoffMs = 500
  ): Promise<void> {
    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers,
        body,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      if (attemptsLeft > 0) {
        await this.delay(backoffMs);
        return this.sendWithRetry(
          body,
          headers,
          attemptsLeft - 1,
          backoffMs * 2
        );
      }
      console.error("Webhook failed:", err);
      log(
        `Failed to notify webhook after retries: ${err}`,
        Scope.NETWORK,
        Level.ERROR
      );
      throw err;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
