import { EventHandler, EventHandlingResult, Event } from "./events";

export type StateId = string;
export type StateType = "normal" | "choice";

export interface Transition {
  fromState: StateId;
  eventType: string;
  toState: StateId;
  guard?: () => boolean;
  action?: () => void;
}

export interface JsonTransition {
  fromState: StateId;
  eventType: string;
  toState: StateId;
  guardReference?: string;
  actionReference?: string;
}

export interface State {
  id: StateId;
  parent?: StateId;
  type: StateType;
  history?: boolean;
  childMachines: Set<HSM>;
  eventHandlers: Map<string, EventHandler>;
  addEventHandler(eventType: string, handler: EventHandler): void;
  removeEventHandler(eventType: string): void;
  onEnter(): void;
  onExit(): void;
  deliverEvent(event: Event): EventHandlingResult;
}

export interface HSMConfig {
  id: string;
  initial: StateId;
  states: Map<StateId, State>;
  transitions: Transition[];
}

export interface HSMContext {
  activeState: StateId;
  history: Record<StateId, StateId>;
  data: Record<string, unknown>;
}

export interface HSM {
  getConfig(): HSMConfig;
  getContext(): HSMContext;
  getActiveState(): StateId;
  initializeState(initialState: StateId): void;
  getState(stateId: StateId): State | undefined;
  enterState(state: State): void;
  exitState(state: State): void;
  findTransitions(event: Event): Transition[];
  deliverEvent(event: Event): EventHandlingResult;
  getCurrentState(): StateId;
  start(): void;
  exit(): void;
}

export interface HSMConfigJSON {
  id: string;
  initial: string;
  states: Record<string, JsonState>;
  transitions?: JsonTransition[];
}

export interface JsonState {
  id: StateId;
  type?: StateType;
  parent?: StateId;
  history?: boolean;
  handlerReferences?: Record<string, string>;
  childMachine?: HSMConfigJSON;
  childMachines?: HSMConfigJSON[];
}

// Function registry interfaces
export interface GuardRegistry {
  [key: string]: () => boolean;
}

export interface ActionRegistry {
  [key: string]: () => void;
}

export interface HandlerRegistry {
  [key: string]: EventHandler;
}

export interface FunctionRegistry {
  guards: GuardRegistry;
  actions: ActionRegistry;
  handlers: HandlerRegistry;
}
