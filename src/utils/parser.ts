import {
  HSMConfig,
  State,
  StateId,
  JsonState,
  FunctionRegistry,
} from "../types/hsm";
import { EventHandler } from "../types/events";
import { State as StateClass } from "../core/State";
import { HSM } from "../core/HSM";

interface JsonHSMConfig {
  id: string;
  initial: StateId;
  states: Record<StateId, JsonState>;
  transitions?: Array<{
    event: string;
    target: StateId;
  }>;
}

export function parseHSMConfig(
  jsonConfig: JsonHSMConfig,
  registry: FunctionRegistry
): HSMConfig {
  const config: HSMConfig = {
    id: jsonConfig.id,
    initial: jsonConfig.initial,
    states: new Map(),
    transitions: [],
  };

  // Process states recursively
  const processState = (
    stateId: StateId,
    stateData: JsonState,
    parentId?: StateId
  ): State => {
    // Create child machines if specified
    const childMachines = new Set<HSM>();
    if (stateData.childMachine) {
      const childConfig: HSMConfig = {
        id: `${stateId}_child`,
        initial: stateData.childMachine.initial,
        states: new Map(),
        transitions: stateData.childMachine.transitions || [],
      };
      const childHSM = new HSM(childConfig);
      childMachines.add(childHSM);
    }

    // Create event handlers map
    const eventHandlers = new Map<string, EventHandler>();
    if (stateData.handlerReferences) {
      Object.entries(stateData.handlerReferences).forEach(
        ([eventType, handlerName]) => {
          const handler = registry.handlers[handlerName];
          if (!handler) {
            throw new Error(
              `Handler function '${handlerName}' not found in registry`
            );
          }
          eventHandlers.set(eventType, handler);
        }
      );
    }

    // Create the state object
    return new StateClass({
      id: stateId,
      parent: parentId,
      type: stateData.type || "normal",
      history: stateData.history,
      childMachines,
      eventHandlers: Object.fromEntries(eventHandlers),
    });
  };

  // Process all top-level states
  Object.entries(jsonConfig.states).forEach(([stateId, stateData]) => {
    config.states.set(stateId, processState(stateId, stateData));
  });

  // Process transitions
  if (jsonConfig.transitions) {
    config.transitions = jsonConfig.transitions.map((t) => ({
      fromState: jsonConfig.initial,
      eventType: t.event,
      toState: t.target,
    }));
  }

  return config;
}
