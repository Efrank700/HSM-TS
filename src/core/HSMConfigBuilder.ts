import {
  HSMConfig,
  StateId,
  State,
  HSM,
  JsonState,
  FunctionRegistry,
  HSMConfigJSON,
} from "../types/hsm";
import { EventHandler } from "../types/events";
import { InvalidConfigurationError } from "../types/errors";
import { State as StateClass } from "./State";
import { HSM as HSMClass } from "./HSM";

export class HSMConfigBuilder {
  static fromJSON(
    config: HSMConfigJSON,
    registry: FunctionRegistry
  ): HSMConfig {
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
      states.set(id, this.convertState(id, state, registry));
    });

    // Convert transitions
    const transitions =
      config.transitions?.map((transition) => {
        // Look up guard and action functions from registry
        const guard = transition.guardReference
          ? registry.guards[transition.guardReference]
          : undefined;
        const action = transition.actionReference
          ? registry.actions[transition.actionReference]
          : undefined;

        // Validate that referenced functions exist
        if (transition.guardReference && !guard) {
          throw new InvalidConfigurationError(
            `Guard function '${transition.guardReference}' not found in registry`
          );
        }
        if (transition.actionReference && !action) {
          throw new InvalidConfigurationError(
            `Action function '${transition.actionReference}' not found in registry`
          );
        }

        return {
          fromState: transition.fromState,
          eventType: transition.eventType,
          toState: transition.toState,
          guard,
          action,
        };
      }) || [];

    return {
      id: config.id,
      initial: config.initial,
      states,
      transitions,
    };
  }

  private static convertState(
    id: StateId,
    state: JsonState,
    registry: FunctionRegistry
  ): State {
    // Convert event handlers using registry
    const eventHandlers = new Map<string, EventHandler>();
    if (state.handlerReferences) {
      Object.entries(state.handlerReferences).forEach(
        ([eventType, handlerName]) => {
          const handler = registry.handlers[handlerName];
          if (!handler) {
            throw new InvalidConfigurationError(
              `Handler function '${handlerName}' not found in registry`
            );
          }
          eventHandlers.set(eventType, handler);
        }
      );
    }

    // Create child machines
    let childMachines: Set<HSM> | undefined;

    // Handle single child machine
    if (state.childMachine) {
      const childConfig = this.fromJSON(state.childMachine, registry);
      childMachines = new Set([new HSMClass(childConfig)]);
    }

    // Handle concurrent child machines
    if (state.childMachines) {
      childMachines = new Set(
        state.childMachines.map((childConfig) => {
          const config = this.fromJSON(childConfig, registry);
          return new HSMClass(config);
        })
      );
    }

    return new StateClass({
      id,
      parent: state.parent,
      type: state.type || "normal",
      history: state.history,
      childMachines,
      eventHandlers: Object.fromEntries(eventHandlers),
    });
  }
}
