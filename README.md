# Hierarchical State Machine (HSM) Implementation

A TypeScript implementation of a Hierarchical State Machine (HSM) that provides a robust way to manage complex state transitions and behaviors in your applications.

## Features

- Hierarchical state management

- Concurrent states
- Event handling
- Guard conditions
- Entry/exit actions
- Type-safe configuration
- Function registry for handlers, guards, and actions

## Roadmap
- Choice states
- History states (shallow and deep)
- Fork and Join states

## Installation

```bash
yarn add hsm_ts
```

## Usage

### Basic Example

```typescript
import { HSM } from './src/core/HSM';
import { parseHSMConfig } from './src/utils/parser';
import { FunctionRegistry } from './src/types/hsm';

// Create a registry with your handler functions
const registry: FunctionRegistry = {
  guards: {
    canTransition: () => true
  },
  actions: {
    logTransition: () => console.log('Transitioning...')
  },
  handlers: {
    enterState: () => {
      console.log('Entering state');
      return { propagate: false };
    }
  }
};

// Define your state machine configuration
const config = {
  id: "simple",
  initial: "idle",
  states: {
    idle: {
      id: "idle",
      handlerReferences: {
        enter: "enterState"
      },
      transitions: [
        {
          event: "START",
          target: "active",
          guard: "canTransition",
          action: "logTransition"
        }
      ]
    },
    active: {
      id: "active",
      handlerReferences: {
        enter: "enterState"
      }
    }
  }
};

// Create and use the state machine
const hsm = new HSM(parseHSMConfig(config, registry));
hsm.deliverEvent({ type: "START" });
```

### History States Example

```typescript
const registry: FunctionRegistry = {
  handlers: {
    enterChild1: () => {
      console.log("Entering child1");
      return { propagate: false };
    },
    enterChild2: () => {
      console.log("Entering child2");
      return { propagate: false };
    }
  }
};

const config = {
  id: "historyExample",
  initial: "parent",
  states: {
    parent: {
      id: "parent",
      history: true,
      initial: "child1",
      states: {
        child1: {
          id: "child1",
          handlerReferences: {
            enter: "enterChild1"
          },
          transitions: [
            {
              event: "NEXT",
              target: "child2"
            }
          ]
        },
        child2: {
          id: "child2",
          handlerReferences: {
            enter: "enterChild2"
          }
        }
      }
    }
  }
};
```

### Concurrent States Example

```typescript
const registry: FunctionRegistry = {
  handlers: {
    enterStateA: () => {
      console.log("Entering state A");
      return { propagate: false };
    },
    enterStateB: () => {
      console.log("Entering state B");
      return { propagate: false };
    }
  }
};

const config = {
  id: "concurrent",
  initial: "parent",
  states: {
    parent: {
      id: "parent",
      type: "concurrent",
      childMachines: [
        {
          id: "machineA",
          initial: "stateA",
          states: {
            stateA: {
              id: "stateA",
              handlerReferences: {
                enter: "enterStateA"
              }
            }
          }
        },
        {
          id: "machineB",
          initial: "stateB",
          states: {
            stateB: {
              id: "stateB",
              handlerReferences: {
                enter: "enterStateB"
              }
            }
          }
        }
      ]
    }
  }
};
```

## Function Registry

The HSM uses a function registry to manage all handlers, guards, and actions. This provides several benefits:

1. Type safety - all functions are properly typed
2. No eval-like behavior - functions are referenced directly
3. Better security - no string evaluation
4. Easier testing - functions can be mocked
5. Better IDE support - proper code completion and type checking

### Registry Structure

```typescript
interface FunctionRegistry {
  guards: {
    [key: string]: (event: Event) => boolean;
  };
  actions: {
    [key: string]: (event: Event) => void;
  };
  handlers: {
    [key: string]: (event: Event) => EventHandlingResult;
  };
}
```

### Using the Registry

1. Define your functions in the registry
2. Reference them by name in your state configuration
3. Pass the registry to `parseHSMConfig`

```typescript
const registry: FunctionRegistry = {
  guards: {
    canTransition: (event) => event.type === "START"
  },
  actions: {
    logTransition: (event) => console.log(`Transitioning on ${event.type}`)
  },
  handlers: {
    enterState: (event) => {
      console.log(`Entering state on ${event.type}`);
      return { propagate: false };
    }
  }
};
```

Functions can also be added manually to different transitions or states in the JS files as needed.

## API Reference

### HSM Class

- `constructor(config: HSMConfig)`
- `deliverEvent(event: Event): void`
- `getActiveState(): StateId`
- `getActiveStates(): Set<StateId>`

### Event Handling

Events can be handled at any level of the state hierarchy. The `propagate` flag in the `EventHandlingResult` determines whether the event should continue propagating up the hierarchy.

```typescript
interface EventHandlingResult {
  propagate: boolean;
}
```

### State Types

- `normal` - Standard state
- `concurrent` - State that can have multiple active child states
- `history` - State that remembers its last active child state

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
