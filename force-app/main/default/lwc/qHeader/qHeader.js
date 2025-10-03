import { LightningElement, api, track } from "lwc";
import qSubscriber from "c/qSubscriber";
import QUEST_PATH_STEP from "@salesforce/messageChannel/qPathStep__c";

export default class QHeader extends qSubscriber(LightningElement) {
  @api assignedStep = "step1"; // Default to step1
  @track currentStep;

  connectedCallback() {
    super.connectedCallback();
    console.log("qHeader connectedCallback - assignedStep:", this.assignedStep);
    this.subscribeToChannel(QUEST_PATH_STEP, (message) =>
      this.handleMessage(message)
    );
  }

  handleMessage(message) {
    console.log("qHeader received message:", JSON.stringify(message));
    console.log("Current assignedStep:", this.assignedStep);
    this.currentStep = message.currentStep;
    console.log("Updated currentStep to:", this.currentStep);
  }

  get shouldShow() {
    // Show if currentStep matches assignedStep, or if currentStep is undefined (initial state)
    return (
      this.currentStep === this.assignedStep || this.currentStep === undefined
    );
  }

  get headerContent() {
    switch (this.assignedStep) {
      case "step1":
        return "Welcome to Step 1 - Getting Started";
      case "step2":
        return "Step 2 - Configuration";
      case "step3":
        return "Step 3 - Final Review";
      default:
        return "Unknown Step";
    }
  }
}
