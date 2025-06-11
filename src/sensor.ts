import { EventEmitter } from "events";
import { Gpio } from "onoff";
import log, { Level, Scope } from "./utils/logger";

export type DoorState = "OPEN" | "CLOSED";

export interface DoorSensorOptions {
  pin: number;
  edge?: "both" | "rising" | "falling";
  openDelayMs?: number;
  openValue?: number;
}

export class DoorSensor extends EventEmitter {
  private gpio: Gpio;
  private readonly pin: number;
  private readonly edge: "both" | "rising" | "falling";
  private readonly openDelayMs: number;
  private readonly openValue: number;
  private openTimer: NodeJS.Timeout | null = null;

  constructor(options: DoorSensorOptions) {
    super();
    this.pin = options.pin;
    this.edge = options.edge ?? "both";
    this.openDelayMs = options.openDelayMs ?? 0;
    this.openValue = options.openValue ?? 1;

    log(
      `Initializing DoorSensor on GPIO${this.pin} (edge=${this.edge}, openDelay=${this.openDelayMs}ms, openValue=${this.openValue})`,
      Scope.SYSTEM,
      Level.INFO
    );

    this.gpio = new Gpio(this.pin, "in", this.edge);

    this.startMonitoring();
  }

  public onChange(listener: (state: DoorState) => void): this {
    return this.on("change", listener);
  }

  public onOpen(listener: () => void): this {
    return this.on("open", listener);
  }

  public onClose(listener: () => void): this {
    return this.on("close", listener);
  }

  public async shutdown(): Promise<void> {
    try {
      log(
        `Shutting down DoorSensor on GPIO${this.pin}`,
        Scope.SYSTEM,
        Level.INFO
      );
      this.gpio.unexport();
      if (this.openTimer) {
        clearTimeout(this.openTimer);
      }
    } catch (err: any) {
      log(
        `Error during DoorSensor cleanup: ${err.message}`,
        Scope.SYSTEM,
        Level.ERROR
      );
    }
  }

  private startMonitoring(): void {
    this.gpio.watch((err, value) => {
      if (err) {
        log(
          `GPIO${this.pin} read error: ${err.message}`,
          Scope.SENSOR,
          Level.ERROR
        );
        return;
      }

      if (typeof value !== "number") {
        log(
          `Unexpected GPIO${this.pin} value: ${value}`,
          Scope.SENSOR,
          Level.WARN
        );
        return;
      }

      const state: DoorState = value === this.openValue ? "OPEN" : "CLOSED";
      log(
        `DoorSensor GPIO${this.pin} state detected: ${state}`,
        Scope.SENSOR,
        Level.INFO
      );

      if (state === "OPEN" && this.openDelayMs > 0) {
        if (this.openTimer) {
          clearTimeout(this.openTimer);
        }
        this.openTimer = setTimeout(() => {
          const currentVal = this.gpio.readSync();
          if (currentVal === this.openValue) {
            log(
              `DoorSensor GPIO${this.pin} confirmed OPEN after ${this.openDelayMs}ms`,
              Scope.SENSOR,
              Level.INFO
            );
            this.emit("open");
            this.emit("change", "OPEN");
          }
        }, this.openDelayMs);
      } else {
        if (this.openTimer) {
          clearTimeout(this.openTimer);
          this.openTimer = null;
        }
        if (state === "OPEN") {
          log(
            `DoorSensor GPIO${this.pin} OPEN (no delay)`,
            Scope.SENSOR,
            Level.INFO
          );
          this.emit("open");
        } else {
          log(`DoorSensor GPIO${this.pin} CLOSED`, Scope.SENSOR, Level.INFO);
          this.emit("close");
        }
        this.emit("change", state);
      }
    });

    log(
      `DoorSensor monitoring started on GPIO${this.pin}`,
      Scope.SYSTEM,
      Level.INFO
    );
  }
}
