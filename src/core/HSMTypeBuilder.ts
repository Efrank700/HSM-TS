import { EventType, TransitionType } from "../types/events";
import { HSMConfig, State } from "../types/hsm";
import { EventHandler } from "../types/events";

export class HSMTypeBuilder {
  static buildTypes(config: HSMConfig): {
    events: Record<string, EventType>;
    transitions: Record<string, TransitionType>;
  } {
    const events = new Set<string>();
    const transitions = new Set<string>();

    // Process each state recursively
    config.states.forEach((state, stateName) => {
      this.processState(stateName, state, events, transitions);
    });

    // Process transitions
    config.transitions.forEach((transition) => {
      events.add(transition.eventType);
      transitions.add(
        `${transition.fromState}_to_${transition.toState}_${transition.eventType}`
      );
    });

    // Convert sets to maps
    const eventsMap: Record<string, EventType> = {};
    const transitionsMap: Record<string, TransitionType> = {};

    events.forEach((event) => {
      eventsMap[event] = event as EventType;
    });

    transitions.forEach((transition) => {
      transitionsMap[transition] = transition as TransitionType;
    });

    return {
      events: eventsMap,
      transitions: transitionsMap,
    };
  }

  private static processState(
    stateName: string,
    state: State,
    events: Set<string>,
    transitions: Set<string>
  ): void {
    // Process event handlers
    state.eventHandlers.forEach((_: EventHandler, eventType: string) => {
      events.add(eventType);
    });

    // Process child machine if exists
    if (state.childMachines) {
      state.childMachines.forEach((child) => {
        const childTypes = this.buildTypes(child.getConfig());
        Object.keys(childTypes.events).forEach((event) => events.add(event));
        Object.keys(childTypes.transitions).forEach((transition) =>
          transitions.add(transition)
        );
      });
    }
  }
}
