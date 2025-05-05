import { HSMTypeBuilder } from "../core/HSMTypeBuilder";
import { State } from "../core/State";
import { HSMConfig } from "../types/hsm";

describe("HSMTypeBuilder", () => {
  it("should generate event and transition types from config", () => {
    const config = {
      id: "trafficLight",
      initial: "red",
      states: new Map([
        [
          "red",
          new State({
            id: "red",
            eventHandlers: {
              TIMER: () => ({ handled: true, propagate: false }),
            },
          }),
        ],
        [
          "green",
          new State({
            id: "green",
            eventHandlers: {
              TIMER: () => ({ handled: true, propagate: false }),
            },
          }),
        ],
        [
          "yellow",
          new State({
            id: "yellow",
            eventHandlers: {
              TIMER: () => ({ handled: true, propagate: false }),
            },
          }),
        ],
      ]),
      transitions: [
        {
          fromState: "red",
          toState: "green",
          eventType: "TIMER",
        },
        {
          fromState: "green",
          toState: "yellow",
          eventType: "TIMER",
        },
        {
          fromState: "yellow",
          toState: "red",
          eventType: "TIMER",
        },
      ],
    } as unknown as HSMConfig;

    const types = HSMTypeBuilder.buildTypes(config);

    // Verify events
    expect(types.events).toEqual({
      TIMER: "TIMER",
    });

    // Verify transitions
    expect(types.transitions).toEqual({
      red_to_green_TIMER: "red_to_green_TIMER",
      green_to_yellow_TIMER: "green_to_yellow_TIMER",
      yellow_to_red_TIMER: "yellow_to_red_TIMER",
    });
  });

  it("should handle nested states correctly", () => {
    const config = {
      id: "parentChild",
      initial: "parent",
      states: new Map([
        [
          "parent",
          new State({
            id: "parent",
            eventHandlers: {
              CHILD_EVENT: () => ({ handled: true, propagate: true }),
            },
          }),
        ],
        [
          "child1",
          new State({
            id: "child1",
            parent: "parent",
            eventHandlers: {
              CHILD_EVENT: () => ({ handled: true, propagate: false }),
            },
          }),
        ],
        [
          "child2",
          new State({
            id: "child2",
            parent: "parent",
            eventHandlers: {
              CHILD_EVENT: () => ({ handled: true, propagate: false }),
            },
          }),
        ],
      ]),
      transitions: [
        {
          fromState: "child1",
          toState: "child2",
          eventType: "CHILD_EVENT",
        },
        {
          fromState: "child2",
          toState: "child1",
          eventType: "CHILD_EVENT",
        },
      ],
    } as unknown as HSMConfig;

    const types = HSMTypeBuilder.buildTypes(config);

    // Verify events
    expect(types.events).toEqual({
      CHILD_EVENT: "CHILD_EVENT",
    });

    // Verify transitions
    expect(types.transitions).toEqual({
      child1_to_child2_CHILD_EVENT: "child1_to_child2_CHILD_EVENT",
      child2_to_child1_CHILD_EVENT: "child2_to_child1_CHILD_EVENT",
    });
  });
});
