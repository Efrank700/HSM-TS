import { HSMConfig, StateId, State, HSM } from "../types/hsm";
import { EventHandler } from "../types/events";
import { InvalidConfigurationError } from "../types/errors";
import { State as StateClass } from "./State";
import { HSM as HSMClass } from "./HSM";

interface StateJSON {
  id: string;
  parent?: string;
  type?: "normal" | "choice";
  history?: boolean;
  childMachine?: HSMConfigJSON;
  eventHandlers?: Record<string, string>;
}

interface HSMConfigJSON {
  id: string;
  initial: string;
  states: Record<string, StateJSON>;
  transitions: Array<{
    fromState: string;
    eventType: string;
    toState: string;
    guard?: string;
    action?: string;
  }>;
}

export class HSMConfigBuilder {
  static fromJSON(config: HSMConfigJSON): HSMConfig {
    // Validate configuration
    if (!config.id) {
      throw new InvalidConfigurationError("Machine ID is required");
    }
    if (!config.initial) {
      throw new InvalidConfigurationError("Initial state is required");
    }
    if (!config.states || Object.keys(config.states).length === 0) {
      throw new InvalidConfigurationError("At least one state is required");
    }

    // Convert states to Map
    const states = new Map<StateId, State>();
    Object.entries(config.states).forEach(([id, state]) => {
      states.set(id, this.convertState(id, state));
    });

    // Convert transitions
    const transitions = config.transitions.map((transition) => ({
      fromState: transition.fromState,
      eventType: transition.eventType,
      toState: transition.toState,
      guard: transition.guard
        ? new Function("return " + transition.guard)()
        : undefined,
      action: transition.action
        ? new Function("return " + transition.action)()
        : undefined,
    }));

    return {
      id: config.id,
      initial: config.initial,
      states,
      transitions,
    };
  }

  private static convertState(id: StateId, state: StateJSON): State {
    // Convert event handlers
    const eventHandlers = new Map<string, EventHandler>();
    if (state.eventHandlers) {
      Object.entries(state.eventHandlers).forEach(
        ([eventType, handlerCode]) => {
          eventHandlers.set(
            eventType,
            new Function("event", handlerCode) as EventHandler
          );
        }
      );
    }

    // Create child machine if specified
    let childMachine: Set<HSM> | undefined;
    if (state.childMachine) {
      const childConfig = this.fromJSON(state.childMachine);
      childMachine = new Set([new HSMClass(childConfig)]);
    }

    return new StateClass({
      id,
      parent: state.parent,
      type: state.type || "normal",
      history: state.history,
      childMachines: childMachine,
      eventHandlers: Object.fromEntries(eventHandlers),
    });
  }
}
