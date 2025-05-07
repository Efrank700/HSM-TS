import { HSMConfigBuilder } from "../core/HSMConfigBuilder";
import { FunctionRegistry, StateType, HSMConfigJSON } from "../types/hsm";

describe("HSM JSON Configuration", () => {
  // Create a test registry with mock functions
  const mockRegistry: FunctionRegistry = {
    guards: {
      allowTransition: jest.fn(() => true),
      preventTransition: jest.fn(() => false),
    },
    actions: {
      logTransition: jest.fn(() => console.log("Transition occurred")),
      logStateChange: jest.fn(() => console.log("State changed")),
    },
    handlers: {
      onEnter: jest.fn(() => ({ propagate: false })),
      onExit: jest.fn(() => ({ propagate: false })),
      handleEvent: jest.fn(() => ({ propagate: false })),
    },
  };

  beforeEach(() => {
    // Clear all mock function calls before each test
    jest.clearAllMocks();
  });

  it("should successfully parse a valid JSON configuration", () => {
    const jsonConfig = {
      id: "testMachine",
      initial: "idle",
      states: {
        idle: {
          id: "idle",
          type: "normal" as StateType,
          handlerReferences: {
            enter: "onEnter",
            exit: "onExit",
          },
        },
        active: {
          id: "active",
          type: "normal" as StateType,
          handlerReferences: {
            enter: "onEnter",
            exit: "onExit",
          },
        },
      },
      transitions: [
        {
          fromState: "idle",
          eventType: "START",
          toState: "active",
          guardReference: "allowTransition",
          actionReference: "logTransition",
        },
      ],
    };

    const config = HSMConfigBuilder.fromJSON(jsonConfig, mockRegistry);
    expect(config.id).toBe("testMachine");
    expect(config.initial).toBe("idle");
    expect(config.states.size).toBe(2);
    expect(config.transitions.length).toBe(1);

    // Verify that the functions were properly mapped
    const transition = config.transitions[0];
    expect(transition.guard).toBe(mockRegistry.guards.allowTransition);
    expect(transition.action).toBe(mockRegistry.actions.logTransition);

    const idleState = config.states.get("idle");
    expect(idleState?.eventHandlers.get("enter")).toBe(
      mockRegistry.handlers.onEnter
    );
    expect(idleState?.eventHandlers.get("exit")).toBe(
      mockRegistry.handlers.onExit
    );
  });

  it("should throw error for missing handler reference", () => {
    const jsonConfig = {
      id: "testMachine",
      initial: "idle",
      states: {
        idle: {
          id: "idle",
          type: "normal" as StateType,
          handlerReferences: {
            enter: "nonExistentHandler",
          },
        },
      },
      transitions: [],
    };

    expect(() => HSMConfigBuilder.fromJSON(jsonConfig, mockRegistry)).toThrow(
      "Handler function 'nonExistentHandler' not found in registry"
    );
  });

  it("should throw error for missing guard reference", () => {
    const jsonConfig = {
      id: "testMachine",
      initial: "idle",
      states: {
        idle: {
          id: "idle",
          type: "normal" as StateType,
        },
        active: {
          id: "active",
          type: "normal" as StateType,
        },
      },
      transitions: [
        {
          fromState: "idle",
          eventType: "START",
          toState: "active",
          guardReference: "nonExistentGuard",
        },
      ],
    };

    expect(() => HSMConfigBuilder.fromJSON(jsonConfig, mockRegistry)).toThrow(
      "Guard function 'nonExistentGuard' not found in registry"
    );
  });

  it("should throw error for missing action reference", () => {
    const jsonConfig = {
      id: "testMachine",
      initial: "idle",
      states: {
        idle: {
          id: "idle",
          type: "normal" as StateType,
        },
        active: {
          id: "active",
          type: "normal" as StateType,
        },
      },
      transitions: [
        {
          fromState: "idle",
          eventType: "START",
          toState: "active",
          actionReference: "nonExistentAction",
        },
      ],
    };

    expect(() => HSMConfigBuilder.fromJSON(jsonConfig, mockRegistry)).toThrow(
      "Action function 'nonExistentAction' not found in registry"
    );
  });

  it("should handle nested state machines correctly", () => {
    const jsonConfig = {
      id: "parentMachine",
      initial: "parent",
      states: {
        parent: {
          id: "parent",
          type: "normal" as StateType,
          handlerReferences: {
            enter: "onEnter",
            exit: "onExit",
          },
          childMachine: {
            id: "childMachine",
            initial: "child1",
            states: {
              child1: {
                id: "child1",
                type: "normal" as StateType,
                handlerReferences: {
                  enter: "onEnter",
                  exit: "onExit",
                },
              },
              child2: {
                id: "child2",
                type: "normal" as StateType,
                handlerReferences: {
                  enter: "onEnter",
                  exit: "onExit",
                },
              },
            },
            transitions: [
              {
                fromState: "child1",
                eventType: "NEXT",
                toState: "child2",
                guardReference: "allowTransition",
                actionReference: "logTransition",
              },
            ],
          },
        },
      },
    };

    const config = HSMConfigBuilder.fromJSON(jsonConfig, mockRegistry);
    const parentState = config.states.get("parent");
    expect(parentState).toBeDefined();
    expect(parentState?.childMachines.size).toBe(1);

    const childMachine = Array.from(parentState?.childMachines || [])[0];
    expect(childMachine.getConfig().states.size).toBe(2);
    expect(childMachine.getConfig().transitions.length).toBe(1);

    // Verify that the functions were properly mapped in the child machine
    const childTransition = childMachine.getConfig().transitions[0];
    expect(childTransition.guard).toBe(mockRegistry.guards.allowTransition);
    expect(childTransition.action).toBe(mockRegistry.actions.logTransition);

    const child1State = childMachine.getConfig().states.get("child1");
    expect(child1State?.eventHandlers.get("enter")).toBe(
      mockRegistry.handlers.onEnter
    );
    expect(child1State?.eventHandlers.get("exit")).toBe(
      mockRegistry.handlers.onExit
    );
  });

  it("should properly map function references to actual functions", () => {
    const mockGuard = jest.fn(() => true);
    const mockAction = jest.fn();
    const mockHandler = jest.fn(() => ({ propagate: false }));

    const testRegistry: FunctionRegistry = {
      guards: {
        testGuard: mockGuard,
      },
      actions: {
        testAction: mockAction,
      },
      handlers: {
        testHandler: mockHandler,
      },
    };

    const jsonConfig = {
      id: "testMachine",
      initial: "state1",
      states: {
        state1: {
          id: "state1",
          type: "normal" as StateType,
          handlerReferences: {
            enter: "testHandler",
          },
        },
        state2: {
          id: "state2",
          type: "normal" as StateType,
        },
      },
      transitions: [
        {
          fromState: "state1",
          eventType: "TEST",
          toState: "state2",
          guardReference: "testGuard",
          actionReference: "testAction",
        },
      ],
    };

    const config = HSMConfigBuilder.fromJSON(jsonConfig, testRegistry);

    // Verify guard function
    const transition = config.transitions[0];
    expect(transition.guard).toBe(mockGuard);
    expect(transition.action).toBe(mockAction);

    // Verify handler function
    const state = config.states.get("state1");
    const handler = state?.eventHandlers.get("enter");
    expect(handler).toBe(mockHandler);
  });

  it("should handle nested machines with their own function registries", () => {
    const childRegistry: FunctionRegistry = {
      guards: {
        childGuard: jest.fn(() => true),
      },
      actions: {
        childAction: jest.fn(),
      },
      handlers: {
        childHandler: jest.fn(() => ({ propagate: false })),
      },
    };

    const jsonConfig = {
      id: "parentMachine",
      initial: "parent",
      states: {
        parent: {
          id: "parent",
          type: "normal" as StateType,
          handlerReferences: {
            enter: "onEnter",
          },
          childMachine: {
            id: "childMachine",
            initial: "child1",
            states: {
              child1: {
                id: "child1",
                type: "normal" as StateType,
                handlerReferences: {
                  enter: "childHandler",
                },
              },
            },
            transitions: [
              {
                fromState: "child1",
                eventType: "CHILD_EVENT",
                toState: "child1",
                guardReference: "childGuard",
                actionReference: "childAction",
              },
            ],
          },
        },
      },
    };

    // Create a combined registry for the test
    const combinedRegistry: FunctionRegistry = {
      guards: { ...mockRegistry.guards, ...childRegistry.guards },
      actions: { ...mockRegistry.actions, ...childRegistry.actions },
      handlers: { ...mockRegistry.handlers, ...childRegistry.handlers },
    };

    const config = HSMConfigBuilder.fromJSON(jsonConfig, combinedRegistry);
    const parentState = config.states.get("parent");
    const childMachine = Array.from(parentState?.childMachines || [])[0];

    // Verify parent machine functions
    expect(parentState?.eventHandlers.get("enter")).toBe(
      combinedRegistry.handlers.onEnter
    );

    // Verify child machine functions
    const childTransition = childMachine.getConfig().transitions[0];
    expect(childTransition.guard).toBe(combinedRegistry.guards.childGuard);
    expect(childTransition.action).toBe(combinedRegistry.actions.childAction);

    const childState = childMachine.getConfig().states.get("child1");
    expect(childState?.eventHandlers.get("enter")).toBe(
      combinedRegistry.handlers.childHandler
    );
  });

  it("should handle multiple levels of nesting", () => {
    const jsonConfig = {
      id: "grandparentMachine",
      initial: "grandparent",
      states: {
        grandparent: {
          id: "grandparent",
          type: "normal" as StateType,
          handlerReferences: {
            enter: "onEnter",
          },
          childMachine: {
            id: "parentMachine",
            initial: "parent",
            states: {
              parent: {
                id: "parent",
                type: "normal" as StateType,
                handlerReferences: {
                  enter: "onEnter",
                },
                childMachine: {
                  id: "childMachine",
                  initial: "child",
                  states: {
                    child: {
                      id: "child",
                      type: "normal" as StateType,
                      handlerReferences: {
                        enter: "onEnter",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const config = HSMConfigBuilder.fromJSON(jsonConfig, mockRegistry);

    // Verify grandparent
    const grandparentState = config.states.get("grandparent");
    expect(grandparentState?.eventHandlers.get("enter")).toBe(
      mockRegistry.handlers.onEnter
    );

    // Verify parent
    const parentMachine = Array.from(grandparentState?.childMachines || [])[0];
    const parentState = parentMachine.getConfig().states.get("parent");
    expect(parentState?.eventHandlers.get("enter")).toBe(
      mockRegistry.handlers.onEnter
    );

    // Verify child
    const childMachine = Array.from(parentState?.childMachines || [])[0];
    const childState = childMachine.getConfig().states.get("child");
    expect(childState?.eventHandlers.get("enter")).toBe(
      mockRegistry.handlers.onEnter
    );
  });

  it("should handle nested machines with transitions between parent and child states", () => {
    const jsonConfig = {
      id: "parentMachine",
      initial: "parent1",
      states: {
        parent1: {
          id: "parent1",
          type: "normal" as StateType,
          handlerReferences: {
            enter: "onEnter",
          },
          childMachine: {
            id: "childMachine",
            initial: "child1",
            states: {
              child1: {
                id: "child1",
                type: "normal" as StateType,
                handlerReferences: {
                  enter: "onEnter",
                },
              },
              child2: {
                id: "child2",
                type: "normal" as StateType,
                handlerReferences: {
                  enter: "onEnter",
                },
              },
            },
            transitions: [
              {
                fromState: "child1",
                eventType: "CHILD_EVENT",
                toState: "child2",
                guardReference: "allowTransition",
                actionReference: "logTransition",
              },
            ],
          },
        },
        parent2: {
          id: "parent2",
          type: "normal" as StateType,
          handlerReferences: {
            enter: "onEnter",
          },
        },
      },
      transitions: [
        {
          fromState: "parent1",
          eventType: "PARENT_EVENT",
          toState: "parent2",
          guardReference: "allowTransition",
          actionReference: "logTransition",
        },
      ],
    };

    const config = HSMConfigBuilder.fromJSON(jsonConfig, mockRegistry);

    // Verify parent transitions
    const parentTransition = config.transitions[0];
    expect(parentTransition.guard).toBe(mockRegistry.guards.allowTransition);
    expect(parentTransition.action).toBe(mockRegistry.actions.logTransition);

    // Verify child transitions
    const parent1State = config.states.get("parent1");
    const childMachine = Array.from(parent1State?.childMachines || [])[0];
    const childTransition = childMachine.getConfig().transitions[0];
    expect(childTransition.guard).toBe(mockRegistry.guards.allowTransition);
    expect(childTransition.action).toBe(mockRegistry.actions.logTransition);
  });

  it("should handle nested machines with concurrent states", () => {
    const jsonConfig = {
      id: "parentMachine",
      initial: "parent",
      states: {
        parent: {
          id: "parent",
          type: "normal" as StateType,
          handlerReferences: {
            enter: "onEnter",
          },
          childMachine: {
            id: "childMachine",
            initial: "concurrent",
            states: {
              concurrent: {
                id: "concurrent",
                type: "concurrent" as StateType,
                handlerReferences: {
                  enter: "onEnter",
                },
                childMachines: [
                  {
                    id: "child1",
                    initial: "state1",
                    states: {
                      state1: {
                        id: "state1",
                        type: "normal" as StateType,
                        handlerReferences: {
                          enter: "onEnter",
                        },
                      },
                    },
                    transitions: [],
                  } as HSMConfigJSON,
                  {
                    id: "child2",
                    initial: "state2",
                    states: {
                      state2: {
                        id: "state2",
                        type: "normal" as StateType,
                        handlerReferences: {
                          enter: "onEnter",
                        },
                      },
                    },
                    transitions: [],
                  } as HSMConfigJSON,
                ],
              },
            },
          },
        },
      },
    };

    const config = HSMConfigBuilder.fromJSON(jsonConfig, mockRegistry);

    // Verify parent state
    const parentState = config.states.get("parent");
    expect(parentState?.eventHandlers.get("enter")).toBe(
      mockRegistry.handlers.onEnter
    );

    // Verify concurrent state
    const childMachine = Array.from(parentState?.childMachines || [])[0];
    const concurrentState = childMachine.getConfig().states.get("concurrent");
    expect(concurrentState?.eventHandlers.get("enter")).toBe(
      mockRegistry.handlers.onEnter
    );

    // Verify child machines
    const childMachines = Array.from(concurrentState?.childMachines || []);
    expect(childMachines.length).toBe(2);

    // Verify first child machine
    const child1State = childMachines[0].getConfig().states.get("state1");
    expect(child1State?.eventHandlers.get("enter")).toBe(
      mockRegistry.handlers.onEnter
    );

    // Verify second child machine
    const child2State = childMachines[1].getConfig().states.get("state2");
    expect(child2State?.eventHandlers.get("enter")).toBe(
      mockRegistry.handlers.onEnter
    );
  });
});
