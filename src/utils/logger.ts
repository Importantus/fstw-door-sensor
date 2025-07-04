export default function log(
  message: any,
  scope: Scope,
  level: Level = Level.INFO
) {
  const timestring = new Date().toISOString();
  const logMessage = `[${timestring} ${scope ? "| " : ""}${
    scope ?? ""
  }] ${message}`;
  switch (level) {
    case Level.INFO:
      console.log(logMessage);
      break;
    case Level.WARN:
      console.warn(logMessage);
      break;
    case Level.ERROR:
      console.error(logMessage);
      break;
  }
}

export enum Scope {
  SYSTEM = "SYSTEM",
  SENSOR = "SENSOR",
  NETWORK = "NETWORK",
}

export enum Level {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}
