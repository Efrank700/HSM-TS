import { Transition } from "./hsm";

// Unrecoverable errors that should be thrown
export class InvalidStateError extends Error {
  constructor(stateId: string) {
    super(`Invalid state: ${stateId}`);
    this.name = "InvalidStateError";
  }
}

export class InvalidTransitionError extends Error {
  constructor(fromState: string, event: string) {
    super(`No valid transition from state ${fromState} for event ${event}`);
    this.name = "InvalidTransitionError";
  }
}

export class InvalidConfigurationError extends Error {
  constructor(message: string) {
    super(`Invalid state machine configuration: ${message}`);
    this.name = "InvalidConfigurationError";
  }
}

// Event handling results
export type EventHandlingResult = {
  handled: boolean;
  propagate: boolean;
  transition?: Transition;
};

export const STOP_PROPAGATION: EventHandlingResult = {
  handled: true,
  propagate: false,
};

export const CONTINUE_PROPAGATION: EventHandlingResult = {
  handled: true,
  propagate: true,
};

export const NOT_HANDLED: EventHandlingResult = {
  handled: false,
  propagate: true,
};

// Recoverable errors that should be returned
export type TransitionResult = {
  success: boolean;
  error?: {
    code: "NO_TRANSITION" | "GUARD_FAILED" | "TARGET_NOT_FOUND";
    message: string;
  };
  targetState?: string;
};
