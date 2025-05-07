import { HSM } from "../core/HSM";
import { parseHSMConfig } from "../utils/parser";
import { FunctionRegistry } from "../types/hsm";

// Create a registry with our handler functions
const registry: FunctionRegistry = {
  guards: {},
  actions: {},
  handlers: {
    enterRed: () => {
      console.log("Red light");
      return { propagate: false };
    },
    enterYellow: () => {
      console.log("Yellow light");
      return { propagate: false };
    },
    enterGreen: () => {
      console.log("Green light");
      return { propagate: false };
    },
    enterWaiting: () => {
      console.log("Pedestrian waiting");
      return { propagate: false };
    },
    enterCrossing: () => {
      console.log("Pedestrian crossing");
      return { propagate: false };
    },
    enterMaintenance: () => {
      console.log("Maintenance mode");
      return { propagate: false };
    },
  },
};

const trafficLightConfig = {
  id: "trafficLight",
  initial: "operational",
  states: {
    operational: {
      id: "operational",
      initial: "red",
      states: {
        red: {
          id: "red",
          handlerReferences: {
            enter: "enterRed",
          },
          transitions: [
            {
              event: "NEXT",
              target: "green",
            },
          ],
        },
        yellow: {
          id: "yellow",
          handlerReferences: {
            enter: "enterYellow",
          },
          transitions: [
            {
              event: "NEXT",
              target: "red",
            },
          ],
        },
        green: {
          id: "green",
          handlerReferences: {
            enter: "enterGreen",
          },
          transitions: [
            {
              event: "NEXT",
              target: "yellow",
            },
          ],
        },
      },
    },
    pedestrian: {
      id: "pedestrian",
      initial: "waiting",
      states: {
        waiting: {
          id: "waiting",
          handlerReferences: {
            enter: "enterWaiting",
          },
          transitions: [
            {
              event: "PEDESTRIAN_BUTTON",
              target: "crossing",
            },
          ],
        },
        crossing: {
          id: "crossing",
          handlerReferences: {
            enter: "enterCrossing",
          },
          transitions: [
            {
              event: "CROSSING_COMPLETE",
              target: "waiting",
            },
          ],
        },
      },
    },
    maintenance: {
      id: "maintenance",
      handlerReferences: {
        enter: "enterMaintenance",
      },
      transitions: [
        {
          event: "RESUME",
          target: "operational",
        },
      ],
    },
  },
};

// Parse the configuration
const config = parseHSMConfig(trafficLightConfig, registry);

// Create the HSM instance
const trafficLight = new HSM(config);

// Example usage
console.log("Initial state:", trafficLight.getActiveState());

// Send events to transition between states
trafficLight.deliverEvent({ type: "NEXT" });
console.log("After NEXT event:", trafficLight.getActiveState());

trafficLight.deliverEvent({ type: "PEDESTRIAN_BUTTON" });
console.log("After PEDESTRIAN_BUTTON event:", trafficLight.getActiveState());

trafficLight.deliverEvent({ type: "NEXT" });
console.log("After NEXT event:", trafficLight.getActiveState());

trafficLight.deliverEvent({ type: "CROSSING_COMPLETE" });
console.log("After CROSSING_COMPLETE event:", trafficLight.getActiveState());
