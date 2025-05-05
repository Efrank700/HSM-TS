import { HSM } from "../core/HSM";
import { parseHSMConfig } from "../utils/parser";

const trafficLightConfig = {
  id: "trafficLight",
  initial: "operational",
  states: {
    operational: {
      initial: "red",
      states: {
        red: {
          onEntry: '() => console.log("Red light")',
          transitions: [
            {
              event: "NEXT",
              target: "green",
            },
          ],
        },
        yellow: {
          onEntry: '() => console.log("Yellow light")',
          transitions: [
            {
              event: "NEXT",
              target: "red",
            },
          ],
        },
        green: {
          onEntry: '() => console.log("Green light")',
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
      initial: "waiting",
      states: {
        waiting: {
          onEntry: '() => console.log("Pedestrian waiting")',
          transitions: [
            {
              event: "PEDESTRIAN_BUTTON",
              target: "crossing",
            },
          ],
        },
        crossing: {
          onEntry: '() => console.log("Pedestrian crossing")',
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
      onEntry: '() => console.log("Maintenance mode")',
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
const config = parseHSMConfig(trafficLightConfig);

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
