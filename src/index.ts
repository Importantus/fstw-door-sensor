import { WebhookNotifier } from "./notifier";
import { DoorSensor } from "./sensor";
import log, { Level, Scope } from "./utils/logger";

const door = new DoorSensor({ pin: 4 });
const notifier = new WebhookNotifier();

process.on("uncaughtException", (err: Error) => {
  log(`Uncaught Exception: ${err.message}`, Scope.SYSTEM, Level.ERROR);
  door.shutdown();
});

process.on("SIGINT", () => {
  log("Received SIGINT", Scope.SYSTEM, Level.INFO);
  door.shutdown();
});

async function main() {
  door.onChange((state) => {
    log(`Door state changed: ${state}`, Scope.SENSOR, Level.INFO);
    notifier
      .notify({
        open: state === "OPEN",
      })
      .catch((err) => {
        log(
          `Failed to notify webhook: ${err.message}`,
          Scope.NETWORK,
          Level.ERROR
        );
      });
  });

  log("Sensor monitoring started", Scope.SYSTEM, Level.INFO);
}

main().catch((err) => {
  log(`Error in main: ${err.message}`, Scope.SYSTEM, Level.ERROR);
  door.shutdown();
});
