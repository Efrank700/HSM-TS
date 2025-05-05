# Hierarchical State Machine (HSM) Implementation

A TypeScript implementation of a Hierarchical State Machine (HSM) that provides a robust way to manage complex state transitions and behaviors in your applications.

## Features

- **Hierarchical State Management**: Support for nested state machines with parent-child relationships
- **Event Handling**: Comprehensive event handling system with enter/exit actions
- **History Support**: Ability to remember and restore previous states
- **Type Safety**: Fully typed implementation for better development experience
- **Flexible Configuration**: JSON-based configuration for easy state machine definition

## Installation

```bash
npm install hsm-js
```

## Basic Usage

### Configuration Examples

#### 1. Basic State Machine
A simple two-state machine that oscillates between states on a "SWITCH" event:

```json
{
  "id": "BasicMachine",
  "initial": "State1",
  "states": {
    "State1": {
      "id": "State1",
      "type": "normal",
      "eventHandlers": {
        "enter": "State1Entry",
        "exit": "State1Exit"
      }
    },
    "State2": {
      "id": "State2",
      "type": "normal",
      "eventHandlers": {
        "enter": "State2Entry",
        "exit": "State2Exit"
      }
    }
  },
  "transitions": [
    {
      "fromState": "State1",
      "eventType": "SWITCH",
      "toState": "State2"
    },
    {
      "fromState": "State2",
      "eventType": "SWITCH",
      "toState": "State1"
    }
  ]
}
```

#### 2. Nested State Machine
A machine where State2 contains a nested state machine:

```json
{
  "id": "NestedMachine",
  "initial": "State1",
  "states": {
    "State1": {
      "id": "State1",
      "type": "normal",
      "eventHandlers": {
        "enter": "State1Entry",
        "exit": "State1Exit"
      }
    },
    "State2": {
      "id": "State2",
      "type": "normal",
      "eventHandlers": {
        "enter": "State2Entry",
        "exit": "State2Exit"
      },
      "childMachine": {
        "id": "NestedSubMachine",
        "initial": "SubState1",
        "states": {
          "SubState1": {
            "id": "SubState1",
            "type": "normal",
            "eventHandlers": {
              "enter": "SubState1Entry",
              "exit": "SubState1Exit"
            }
          },
          "SubState2": {
            "id": "SubState2",
            "type": "normal",
            "eventHandlers": {
              "enter": "SubState2Entry",
              "exit": "SubState2Exit"
            }
          }
        },
        "transitions": [
          {
            "fromState": "SubState1",
            "eventType": "NEXT",
            "toState": "SubState2"
          },
          {
            "fromState": "SubState2",
            "eventType": "NEXT",
            "toState": "SubState1"
          }
        ]
      }
    }
  },
  "transitions": [
    {
      "fromState": "State1",
      "eventType": "SWITCH",
      "toState": "State2"
    },
    {
      "fromState": "State2",
      "eventType": "SWITCH",
      "toState": "State1"
    }
  ]
}
```

#### 3. Concurrent State Machines
A machine where State2 contains multiple concurrent state machines:

```json
{
  "id": "ConcurrentMachine",
  "initial": "State1",
  "states": {
    "State1": {
      "id": "State1",
      "type": "normal",
      "eventHandlers": {
        "enter": "State1Entry",
        "exit": "State1Exit"
      }
    },
    "State2": {
      "id": "State2",
      "type": "normal",
      "eventHandlers": {
        "enter": "State2Entry",
        "exit": "State2Exit"
      },
      "childMachines": [
        {
          "id": "ConcurrentMachine1",
          "initial": "SubState1",
          "states": {
            "SubState1": {
              "id": "SubState1",
              "type": "normal",
              "eventHandlers": {
                "enter": "SubState1Entry",
                "exit": "SubState1Exit"
              }
            },
            "SubState2": {
              "id": "SubState2",
              "type": "normal",
              "eventHandlers": {
                "enter": "SubState2Entry",
                "exit": "SubState2Exit"
              }
            }
          },
          "transitions": [
            {
              "fromState": "SubState1",
              "eventType": "NEXT",
              "toState": "SubState2"
            },
            {
              "fromState": "SubState2",
              "eventType": "NEXT",
              "toState": "SubState1"
            }
          ]
        },
        {
          "id": "ConcurrentMachine2",
          "initial": "SubStateA",
          "states": {
            "SubStateA": {
              "id": "SubStateA",
              "type": "normal",
              "eventHandlers": {
                "enter": "SubStateAEntry",
                "exit": "SubStateAExit"
              }
            },
            "SubStateB": {
              "id": "SubStateB",
              "type": "normal",
              "eventHandlers": {
                "enter": "SubStateBEntry",
                "exit": "SubStateBExit"
              }
            }
          },
          "transitions": [
            {
              "fromState": "SubStateA",
              "eventType": "NEXT",
              "toState": "SubStateB"
            },
            {
              "fromState": "SubStateB",
              "eventType": "NEXT",
              "toState": "SubStateA"
            }
          ]
        }
      ]
    }
  },
  "transitions": [
    {
      "fromState": "State1",
      "eventType": "SWITCH",
      "toState": "State2"
    },
    {
      "fromState": "State2",
      "eventType": "SWITCH",
      "toState": "State1"
    }
  ]
}
```

### Creating and Using the HSM

```typescript
import { HSM } from 'hsm-js';

// Create a new HSM instance
const hsm = new HSM(config);

// Start the state machine
hsm.start();

// Deliver events to the state machine
hsm.deliverEvent({ type: 'SWITCH' });
hsm.deliverEvent({ type: 'NEXT' });

// Get current state
const currentState = hsm.getCurrentState();
```

## Key Concepts

### States

States are the building blocks of your state machine. Each state can have:
- Enter/exit handlers
- Child state machines
- History tracking
- Event handlers

### Transitions

Transitions define how the state machine moves between states based on events:
- From state
- Event type
- To state
- Optional guards and actions

### Events

Events trigger state transitions and can be handled at multiple levels:
- Global events
- State-specific events
- Child state machine events

## API Reference

### HSM Class

- `constructor(config: HSMConfig)`: Creates a new HSM instance
- `start()`: Initializes the state machine
- `deliverEvent(event: Event)`: Processes an event
- `getCurrentState()`: Returns the current active state
- `getConfig()`: Returns the current configuration
- `getContext()`: Returns the current context

### State Class

- `onEnter()`: Called when entering a state
- `onExit()`: Called when exiting a state
- `deliverEvent(event: Event)`: Processes events for the state
- `addChildMachine(machine: HSM)`: Adds a child state machine
- `removeChildMachine(machine: HSM)`: Removes a child state machine

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue!

## License

MIT
