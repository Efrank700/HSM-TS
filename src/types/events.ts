export type EventType = string;
export type TransitionType = string;

export interface Event {
  type: string;
  data?: unknown;
}

export type EventHandler = (event: Event) => EventHandlingResult;

export type EventHandlingResult = {
  propagate: boolean;
};

export interface EventMap {
  [key: string]: EventType;
}

export interface TransitionMap {
  [key: string]: TransitionType;
}

export interface HSMTypeInfo {
  events: EventMap;
  transitions: TransitionMap;
}

export const NOT_HANDLED: EventHandlingResult = {
  propagate: true,
};

export const STOP_PROPAGATION: EventHandlingResult = {
  propagate: false,
};

export const CONTINUE_PROPAGATION: EventHandlingResult = {
  propagate: true,
};

// Default Enter and Exit events
export const ENTER_EVENT: Event = { type: "enter" };
export const EXIT_EVENT: Event = { type: "exit" };
