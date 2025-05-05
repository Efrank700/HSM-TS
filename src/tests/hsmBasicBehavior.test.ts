import { HSM } from "../core/HSM";
import { State } from "../core/State";
import { HSMConfig } from "../types/hsm";
import { InvalidStateError, InvalidConfigurationError } from "../types/errors";

describe("HSM", () => {
  describe("Error Handling", () => {
    it("should throw InvalidConfigurationError for missing initial state", () => {
      const config = {
        id: "testMachine",
        states: new Map(),
        transitions: [],
        initial: undefined,
      } as unknown as HSMConfig;
      expect(() => new HSM(config)).toThrow(InvalidConfigurationError);
    });

    it("should throw InvalidStateError for invalid initial state", () => {
      const config = {
        id: "testMachine",
        initial: "invalid",
        states: new Map([["idle", new State({ id: "idle" })]]),
        transitions: [],
      } as unknown as HSMConfig;
      expect(() => new HSM(config).start()).toThrow(InvalidStateError);
    });
  });

  describe("Event Handling", () => {
    let hsm: HSM;
    const idleState = new State({
      id: "idle",
      eventHandlers: {
        onEnter: () => ({ propagate: false }),
        onExit: () => ({ propagate: false }),
        ACTION: () => ({ propagate: false }),
      },
    });

    beforeEach(() => {
      const config = {
        id: "testMachine",
        initial: "idle",
        states: new Map([["idle", idleState]]),
        transitions: [],
      } as unknown as HSMConfig;
      hsm = new HSM(config);
    });

    it("should handle events without transitions", () => {
      const result = hsm.deliverEvent({ type: "ACTION" });
      expect(result.propagate).toBe(false);
      expect(hsm.getCurrentState()).toBe("idle");
    });

    it("should propagate unknown events by default", () => {
      const result = hsm.deliverEvent({ type: "UNKNOWN" });
      expect(result.propagate).toBe(true);
    });

    it("should call the event handler for the current state", () => {
      const testCall = jest.fn();
      idleState.addEventHandler("newEvent", () => {
        testCall();
        return { propagate: false };
      });
      const result = hsm.deliverEvent({ type: "newEvent" });
      expect(result.propagate).toBe(false);
      expect(hsm.getCurrentState()).toBe("idle");
      expect(testCall).toHaveBeenCalled();
    });
  });

  describe("Basic State Transitions", () => {
    let hsm: HSM;
    const onEnterCall = jest.fn();
    const onExitCall = jest.fn();
    const idleState = new State({
      id: "idle",
      eventHandlers: {
        onEnter: () => {
          onEnterCall();
          return { propagate: false };
        },
        onExit: () => {
          onExitCall();
          return { propagate: false };
        },
      },
    });
    const runningOnEnterCall = jest.fn();
    const runningOnExitCall = jest.fn();
    const runningState = new State({
      id: "running",
      eventHandlers: {
        onEnter: () => {
          runningOnEnterCall();
          return { propagate: false };
        },
        onExit: () => {
          runningOnExitCall();
          return { propagate: false };
        },
      },
    });

    beforeEach(() => {
      const config = {
        id: "testMachine",
        initial: "idle",
        states: new Map([
          ["idle", idleState],
          ["running", runningState],
        ]),
        transitions: [
          {
            fromState: "idle",
            toState: "running",
            eventType: "START",
          },
          {
            fromState: "running",
            toState: "idle",
            eventType: "STOP",
          },
        ],
      } as unknown as HSMConfig;
      hsm = new HSM(config);
    });

    it("should initialize in the idle state", () => {
      expect(hsm.getCurrentState()).toBe("idle");
      expect(onEnterCall).toHaveBeenCalledTimes(0);
    });

    it("should transition from idle to running on START event", () => {
      hsm.start();
      hsm.deliverEvent({ type: "START" });
      expect(hsm.getCurrentState()).toBe("running");
      expect(onExitCall).toHaveBeenCalled();
      expect(runningOnEnterCall).toHaveBeenCalled();
    });

    it("should transition back to idle on STOP event", () => {
      hsm.start();
      hsm.deliverEvent({ type: "START" });
      hsm.deliverEvent({ type: "STOP" });
      expect(hsm.getCurrentState()).toBe("idle");
      expect(runningOnExitCall).toHaveBeenCalled();
      expect(onEnterCall).toHaveBeenCalled();
    });
  });

  describe("Concurrent Machines", () => {
    let parentMachine: HSM;
    let childMachine1: HSM;
    let childMachine2: HSM;
    let callOrder: string[];
    let childState1: State;
    let childState2: State;
    let childState3: State;
    let childState4: State;
    beforeEach(() => {
      callOrder = [];
      childState1 = new State({
        id: "childState1",
        eventHandlers: {
          onEnter: () => ({ propagate: false }),
          onExit: () => ({ propagate: false }),
          NEXT: () => ({ propagate: true }),
          TEST_EVENT_PROP_1: () => {
            callOrder.push("childState1TestEventProp1");
            return { propagate: true };
          },
          TEST_EVENT_PROP_2: () => {
            callOrder.push("childState1TestEventProp2");
            return { propagate: false };
          },
        },
      });
      childState2 = new State({
        id: "childState2",
        eventHandlers: {
          onEnter: () => ({ propagate: false }),
          onExit: () => ({ propagate: false }),
          NEXT: () => ({ propagate: true }),
          TEST_EVENT_PROP_1: () => {
            callOrder.push("childState2TestEventProp1");
            return { propagate: false };
          },
          TEST_EVENT_PROP_2: () => {
            callOrder.push("childState2TestEventProp2");
            return { propagate: false };
          },
        },
      });
      childState3 = new State({
        id: "childState3",
        eventHandlers: {
          onEnter: () => ({ propagate: false }),
          onExit: () => ({ propagate: false }),
          NEXT: () => ({ propagate: true }),
          TEST_EVENT_PROP_1: () => {
            callOrder.push("childState3TestEventProp1");
            return { propagate: true };
          },
          TEST_EVENT_PROP_2: () => {
            callOrder.push("childState3TestEventProp2");
            return { propagate: false };
          },
        },
      });
      childState4 = new State({
        id: "childState4",
        eventHandlers: {
          onEnter: () => ({ propagate: false }),
          onExit: () => ({ propagate: false }),
          NEXT: () => ({ propagate: true }),
        },
      });

      // Create child machines
      childMachine1 = new HSM({
        id: "childMachine1",
        initial: "childState1",
        states: new Map([
          ["childState1", childState1],
          ["childState3", childState3],
        ]),
        transitions: [
          {
            fromState: "childState1",
            toState: "childState3",
            eventType: "NEXT",
          },
        ],
      } as unknown as HSMConfig);

      childMachine2 = new HSM({
        id: "childMachine2",
        initial: "childState2",
        states: new Map([
          ["childState2", childState2],
          ["childState4", childState4],
        ]),
        transitions: [
          {
            fromState: "childState2",
            toState: "childState4",
            eventType: "NEXT",
          },
        ],
      } as unknown as HSMConfig);

      // Create parent state with child machines
      const parentState = new State({
        id: "parentState",
        eventHandlers: {
          onEnter: () => ({ propagate: false }),
          onExit: () => ({ propagate: false }),
          TEST_EVENT_PROP_1: () => {
            callOrder.push("parentStateTestEventProp1");
            return { propagate: true };
          },
          TEST_EVENT_PROP_2: () => {
            callOrder.push("parentStateTestEventProp2");
            return { propagate: false };
          },
        },
        childMachines: new Set([childMachine1, childMachine2]),
      });

      // Create parent machine
      parentMachine = new HSM({
        id: "parentMachine",
        initial: "parentState",
        states: new Map([["parentState", parentState]]),
        transitions: [],
      } as unknown as HSMConfig);
    });

    it("should initialize child machines when entering parent state", () => {
      parentMachine.start();
      expect(childMachine1.getCurrentState()).toBe("childState1");
      expect(childMachine2.getCurrentState()).toBe("childState2");
    });

    it("should handle transitions in child machines independently", () => {
      parentMachine.start();

      // Send NEXT event to both child machines
      childMachine1.deliverEvent({ type: "NEXT" });
      childMachine2.deliverEvent({ type: "NEXT" });

      expect(childMachine1.getCurrentState()).toBe("childState3");
      expect(childMachine2.getCurrentState()).toBe("childState4");
    });

    it("should propogate if either child machine wants to propogate", () => {
      parentMachine.start();
      parentMachine.deliverEvent({ type: "TEST_EVENT_PROP_1" });
      expect(callOrder).toEqual([
        "childState1TestEventProp1",
        "childState2TestEventProp1",
        "parentStateTestEventProp1",
      ]);
    });

    it("should not propogate if both child machines do not want to propogate", () => {
      parentMachine.start();
      parentMachine.deliverEvent({ type: "TEST_EVENT_PROP_2" });
      expect(callOrder).toEqual([
        "childState1TestEventProp2",
        "childState2TestEventProp2",
      ]);
    });
  });

  describe("Event Propagation", () => {
    let hsm: HSM;
    const parentState = new State({
      id: "parent",
      eventHandlers: {
        EVENT: () => ({ propagate: true }),
      },
    });
    const childState = new State({
      id: "child",
      parent: "parent",
      eventHandlers: {
        EVENT: () => ({ propagate: false }),
      },
    });

    beforeEach(() => {
      const config = {
        id: "propagationMachine",
        initial: "child",
        states: new Map([
          ["parent", parentState],
          ["child", childState],
        ]),
        transitions: [],
      } as unknown as HSMConfig;
      hsm = new HSM(config);
    });

    it("should propagate events up the state hierarchy", () => {
      const result = hsm.deliverEvent({ type: "EVENT" });
      expect(result.propagate).toBe(false);
    });
  });

  describe("Guard Conditions", () => {
    let hsm: HSM;
    const parentState1 = new State({
      id: "parentState1",
      eventHandlers: {
        EVENT: () => ({ propagate: true }),
      },
    });
    const parentState2 = new State({
      id: "parentState2",
      eventHandlers: {
        EVENT: () => ({ propagate: true }),
      },
    });
    let guard: jest.Mock;
    beforeEach(() => {
      guard = jest.fn();
      const config = {
        id: "guardMachine",
        initial: "parentState1",
        states: new Map([
          ["parentState1", parentState1],
          ["parentState2", parentState2],
        ]),
        transitions: [
          {
            fromState: "parentState1",
            toState: "parentState2",
            eventType: "TRANSITION_PARENT",
            guard: guard,
          },
        ],
      } as unknown as HSMConfig;
      hsm = new HSM(config);
    });

    it("should make the transition if the guard returns true", () => {
      guard.mockReturnValue(true);
      expect(guard).toHaveBeenCalledTimes(0);
      expect(hsm.getCurrentState()).toBe("parentState1");
      const result = hsm.deliverEvent({ type: "TRANSITION_PARENT" });
      expect(result.propagate).toBe(true);
      expect(hsm.getCurrentState()).toBe("parentState2");
      expect(guard).toHaveBeenCalledTimes(1);
    });

    it("should not make the transition if the guard returns false", () => {
      guard.mockReturnValue(false);
      expect(guard).toHaveBeenCalledTimes(0);
      expect(hsm.getCurrentState()).toBe("parentState1");
      const result = hsm.deliverEvent({ type: "TRANSITION_PARENT" });
      expect(result.propagate).toBe(true);
      expect(hsm.getCurrentState()).toBe("parentState1");
      expect(guard).toHaveBeenCalledTimes(1);
    });
  });
});
