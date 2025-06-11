import crypto from "crypto";
import { environment } from "./environment";

export function signPayload(payload: object, timestamp: string): string {
  const body = JSON.stringify({ ...payload, timestamp });
  return crypto
    .createHmac("sha256", environment.signKey)
    .update(body)
    .digest("hex");
}
