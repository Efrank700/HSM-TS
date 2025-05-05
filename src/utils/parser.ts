import { HSMConfig, State, StateId, StateType, Transition } from "../types/hsm";
import { EventHandler } from "../types/events";
import { State as StateClass } from "../core/State";
import { HSM } from "../core/HSM";

interface JsonState {
  type?: StateType;
  history?: boolean;
  initial?: StateId;
  states?: Record<StateId, JsonState>;
  onEntry?: string;
  transitions?: Array<{
    event: string;
    target: StateId;
  }>;
  childMachine?: {
    initial: StateId;
    transitions?: Transition[];
  };
  eventHandlers?: Record<string, string>;
}

interface JsonHSMConfig {
  id: string;
  initial: StateId;
  states: Record<StateId, JsonState>;
  transitions?: Array<{
    event: string;
    target: StateId;
  }>;
}

export function parseHSMConfig(jsonConfig: JsonHSMConfig): HSMConfig {
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
    if (stateData.eventHandlers) {
      Object.entries(stateData.eventHandlers).forEach(
        ([eventType, handlerCode]) => {
          if (typeof handlerCode === "string") {
            eventHandlers.set(
              eventType,
              new Function("event", handlerCode) as EventHandler
            );
          }
        }
      );
    }

    // Add onEntry handler if specified
    if (stateData.onEntry) {
      eventHandlers.set(
        "enter",
        new Function("event", stateData.onEntry) as EventHandler
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
