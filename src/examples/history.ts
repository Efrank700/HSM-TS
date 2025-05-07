import { HSM } from "../core/HSM";
import { parseHSMConfig } from "../utils/parser";
import { FunctionRegistry } from "../types/hsm";

// Create a registry with our handler functions
const registry: FunctionRegistry = {
  guards: {},
  actions: {},
  handlers: {
    enterChild1: () => {
      console.log("Entering child1");
      return { propagate: false };
    },
    enterChild2: () => {
      console.log("Entering child2");
      return { propagate: false };
    },
    enterOther: () => {
      console.log("Entering other state");
      return { propagate: false };
    },
  },
};

const historyExample = {
  initial: "parent",
  states: {
    parent: {
      id: "parent",
      history: true, // This state has history
      initial: "child1",
      states: {
        child1: {
          id: "child1",
          handlerReferences: {
            enter: "enterChild1",
          },
          transitions: [
            {
              event: "NEXT",
              target: "child2",
            },
          ],
        },
        child2: {
          id: "child2",
          handlerReferences: {
            enter: "enterChild2",
          },
          transitions: [
            {
              event: "NEXT",
              target: "child1",
            },
          ],
        },
      },
      transitions: [
        {
          event: "LEAVE",
          target: "other",
        },
      ],
    },
    other: {
      id: "other",
      handlerReferences: {
        enter: "enterOther",
      },
      transitions: [
        {
          event: "RETURN",
          target: "parent",
        },
      ],
    },
  },
};

// Parse the configuration
const config = parseHSMConfig(
  {
    id: "historyExample",
    ...historyExample,
  },
  registry
);

// Create the HSM instance
const hsm = new HSM(config);

// Example usage
console.log("Initial state:", hsm.getActiveState());

// Move to child2
hsm.deliverEvent({ type: "NEXT" });
console.log("After NEXT event:", hsm.getActiveState());

// Leave parent state
hsm.deliverEvent({ type: "LEAVE" });
console.log("After LEAVE event:", hsm.getActiveState());

// Return to parent state - should remember child2
hsm.deliverEvent({ type: "RETURN" });
console.log("After RETURN event:", hsm.getActiveState());
