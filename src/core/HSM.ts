import {
  HSMConfig,
  StateId,
  HSMContext,
  Transition,
  State,
} from "../types/hsm";
import { Event, EventHandlingResult } from "../types/events";
import { InvalidStateError, InvalidConfigurationError } from "../types/errors";

export class HSM {
  private config: HSMConfig;
  private context: HSMContext;
  private activeState: StateId;

  constructor(config: HSMConfig) {
    this.config = config;
    this.context = {
      activeState: config.initial,
      history: {},
      data: {},
    };

    if (!config.initial) {
      throw new InvalidConfigurationError("Initial state is required");
    }

    this.activeState = config.initial;
  }

  public getConfig(): HSMConfig {
    return this.config;
  }

  public getContext(): HSMContext {
    return this.context;
  }

  public getActiveState(): StateId {
    return this.activeState;
  }

  public initializeState(initialState: StateId): void {
    const state = this.getState(initialState);
    if (!state) {
      throw new InvalidStateError(initialState);
    }
    this.enterState(state);
  }

  public getState(stateId: StateId): State | undefined {
    return this.config.states.get(stateId);
  }

  public enterState(state: State): void {
    this.activeState = state.id;
    this.context.activeState = state.id;
    state.onEnter();
  }

  public exitState(state: State): void {
    state.onExit();
  }

  public findTransitions(event: Event): Transition[] {
    return this.config.transitions.filter(
      (transition) =>
        transition.fromState === this.activeState &&
        transition.eventType === event.type
    );
  }

  deliverEvent(event: Event): EventHandlingResult {
    const state = this.getState(this.activeState);
    if (!state) {
      throw new InvalidStateError(this.activeState);
    }

    // First try to deliver to the active state
    const result = state.deliverEvent(event);
    if (!result.propagate) {
      return result;
    }

    // If not handled, check for transitions
    const transitions = this.findTransitions(event);
    if (transitions.length > 0) {
      // Execute all valid transitions
      transitions.forEach((transition) => {
        if (!transition.guard || transition.guard()) {
          const fromState = this.getState(transition.fromState);
          const toState = this.getState(transition.toState);

          if (fromState && toState) {
            this.exitState(fromState);
            if (transition.action) {
              transition.action();
            }
            this.enterState(toState);
          }
        }
      });
    }

    return { propagate: true };
  }

  getCurrentState(): StateId {
    return this.activeState;
  }

  start(): void {
    this.initializeState(this.config.initial);
  }

  exit(): void {
    const state = this.getState(this.activeState);
    if (state) {
      this.exitState(state);
    }
  }
}
