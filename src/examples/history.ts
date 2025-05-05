import { HSM } from "../core/HSM";
import { parseHSMConfig } from "../utils/parser";

const historyExample = {
  initial: "parent",
  states: {
    parent: {
      history: true, // This state has history
      initial: "child1",
      states: {
        child1: {
          onEntry: '() => console.log("Entering child1")',
          transitions: [
            {
              event: "NEXT",
              target: "child2",
            },
          ],
        },
        child2: {
          onEntry: '() => console.log("Entering child2")',
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
      onEntry: '() => console.log("Entering other state")',
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
const config = parseHSMConfig({
  id: "historyExample",
  ...historyExample,
});

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
