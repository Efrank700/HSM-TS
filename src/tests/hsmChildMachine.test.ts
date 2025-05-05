import { HSM } from "../core/HSM";
import { State } from "../core/State";
import { HSMConfig } from "../types/hsm";

describe("HSM with Child Machines", () => {
  describe("Basic Child Machine Tests", () => {
    let parentMachine: HSM;
    let childMachine: HSM;
    let childState1OnEnterCall: jest.Mock;
    let childState1OnExitCall: jest.Mock;
    let childState2OnEnterCall: jest.Mock;
    let childState2OnExitCall: jest.Mock;
    let parentState1OnEnterCall: jest.Mock;
    let parentState1OnExitCall: jest.Mock;
    let parentState2OnEnterCall: jest.Mock;
    let parentState2OnExitCall: jest.Mock;

    let childState1: State;
    let childState2: State;
    let parentState1: State;
    let parentState2: State;
    let callOrder: string[];

    beforeEach(() => {
      childState1OnEnterCall = jest.fn();
      childState1OnExitCall = jest.fn();
      childState2OnEnterCall = jest.fn();
      childState2OnExitCall = jest.fn();
      callOrder = [];
      childState1 = new State({
        id: "childState1",
        eventHandlers: {
          onEnter: () => {
            childState1OnEnterCall();
            callOrder.push("childState1Enter");
            return { handled: true, propagate: false };
          },
          onExit: () => {
            childState1OnExitCall();
            callOrder.push("childState1Exit");
            return { handled: true, propagate: false };
          },
        },
      });
      childState2 = new State({
        id: "childState2",
        eventHandlers: {
          onEnter: () => {
            childState2OnEnterCall();
            callOrder.push("childState2Enter");
            return { handled: true, propagate: false };
          },
          onExit: () => {
            childState2OnExitCall();
            callOrder.push("childState2Exit");
            return { handled: true, propagate: false };
          },
        },
      });
      childMachine = new HSM({
        id: "childMachine",
        initial: "childState1",
        states: new Map([
          ["childState1", childState1],
          ["childState2", childState2],
        ]),
        transitions: [
          {
            fromState: "childState1",
            toState: "childState2",
            eventType: "TRANSITION_BOTH",
          },
          {
            fromState: "childState1",
            toState: "childState2",
            eventType: "TRANSITION_CHILD",
          },
        ],
      } as unknown as HSMConfig);

      parentState1OnEnterCall = jest.fn();
      parentState1OnExitCall = jest.fn();
      parentState2OnEnterCall = jest.fn();
      parentState2OnExitCall = jest.fn();
      parentState1 = new State({
        id: "parentState1",
        eventHandlers: {
          onEnter: () => {
            parentState1OnEnterCall();
            callOrder.push("parentState1Enter");
            return { handled: true, propagate: false };
          },
          onExit: () => {
            parentState1OnExitCall();
            callOrder.push("parentState1Exit");
            return { handled: true, propagate: false };
          },
        },
        childMachines: new Set([childMachine]),
      });
      parentState2 = new State({
        id: "parentState2",
        eventHandlers: {
          onEnter: () => {
            parentState2OnEnterCall();
            callOrder.push("parentState2Enter");
            return { handled: true, propagate: false };
          },
          onExit: () => {
            parentState2OnExitCall();
            callOrder.push("parentState2Exit");
            return { handled: true, propagate: false };
          },
        },
      });
      parentMachine = new HSM({
        id: "parentMachine",
        initial: "parentState1",
        states: new Map([
          ["parentState1", parentState1],
          ["parentState2", parentState2],
        ]),
        transitions: [
          {
            fromState: "parentState1",
            toState: "parentState2",
            eventType: "TRANSITION_BOTH",
          },
          {
            fromState: "parentState1",
            toState: "parentState2",
            eventType: "TRANSITION_PARENT",
          },
        ],
      } as unknown as HSMConfig);
    });

    it("The parent machine should be entered before the child machine", () => {
      parentMachine.start();
      expect(childMachine.getCurrentState()).toBe("childState1");
      expect(childState1OnEnterCall).toHaveBeenCalled();
      expect(parentState1OnEnterCall).toHaveBeenCalled();
      expect(callOrder).toEqual(["parentState1Enter", "childState1Enter"]);
    });

    it("transitions in the child state should occur before the parent state", () => {
      parentMachine.start();
      callOrder = [];
      parentMachine.deliverEvent({ type: "TRANSITION_BOTH" });
      expect(callOrder).toEqual([
        "childState1Exit",
        "childState2Enter",
        "childState2Exit",
        "parentState1Exit",
        "parentState2Enter",
      ]);
    });

    it("should exit the child machine if the parent machine state changes", () => {
      parentMachine.start();
      callOrder = [];
      parentMachine.deliverEvent({ type: "TRANSITION_PARENT" });
      expect(callOrder).toEqual([
        "childState1Exit",
        "parentState1Exit",
        "parentState2Enter",
      ]);
    });
  });
});
