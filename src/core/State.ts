import { HSM } from "../types/hsm";
import {
  Event,
  EventHandler,
  EventHandlingResult,
  NOT_HANDLED,
  ENTER_EVENT,
  EXIT_EVENT,
} from "../types/events";

export class State {
  id: string;
  parent?: string;
  type: "normal" | "choice";
  history?: boolean;
  childMachines: Set<HSM>;
  eventHandlers: Map<string, EventHandler>;

  constructor(config: {
    id: string;
    parent?: string;
    type?: "normal" | "choice";
    history?: boolean;
    childMachines?: Set<HSM>;
    eventHandlers?: Record<string, EventHandler>;
  }) {
    this.id = config.id;
    this.parent = config.parent;
    this.type = config.type || "normal";
    this.history = config.history;
    this.childMachines = config.childMachines || new Set();
    this.eventHandlers = new Map(Object.entries(config.eventHandlers || {}));
  }

  addChildMachine(machine: HSM): void {
    this.childMachines.add(machine);
  }

  removeChildMachine(machine: HSM): void {
    this.childMachines.delete(machine);
  }

  addEventHandler(eventType: string, handler: EventHandler): void {
    this.eventHandlers.set(eventType, handler);
  }

  removeEventHandler(eventType: string): void {
    this.eventHandlers.delete(eventType);
  }

  onEnter(): void {
    if (this.eventHandlers.has("onEnter")) {
      this.eventHandlers.get("onEnter")?.(ENTER_EVENT);
    }

    this.childMachines.forEach((machine) => machine.start());
  }

  onExit(): void {
    // Exit all child machines before exiting the state
    this.childMachines.forEach((machine) => machine.exit());

    if (this.eventHandlers.has("onExit")) {
      this.eventHandlers.get("onExit")?.(EXIT_EVENT);
    }
  }

  deliverEvent(event: Event): EventHandlingResult {
    if (this.childMachines.size > 0) {
      // Try to deliver to all child machines
      let allChildrenNotPropogate = false;
      for (const machine of this.childMachines) {
        const result = machine.deliverEvent(event);
        allChildrenNotPropogate = allChildrenNotPropogate || result.propagate;
      }

      // Only do not propogate if all children did not propogate
      if (!allChildrenNotPropogate) {
        return { propagate: false };
      }
    }

    // Check for a matching event handler
    const handler = this.eventHandlers.get(event.type);
    if (handler) {
      return handler(event);
    }

    return NOT_HANDLED;
  }
}
