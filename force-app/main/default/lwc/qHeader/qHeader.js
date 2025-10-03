import { LightningElement, api, track, wire } from "lwc";
import {
  subscribe,
  MessageContext,
  unsubscribe,
} from "lightning/messageService";
import QUEST_PATH_STEP from "@salesforce/messageChannel/qPathStep__c";

export default class QHeader extends LightningElement {
  @api assignedStep = "step1"; // Default to step1
  @track currentStep;
  subscription = null;

  @wire(MessageContext)
  messageContext;

  connectedCallback() {
    console.log("qHeader connectedCallback - assignedStep:", this.assignedStep);
    this.subscribeToMessageChannel();
  }

  renderedCallback() {
    // Retry subscription if messageContext becomes available
    if (this.messageContext && !this.subscription) {
      this.subscribeToMessageChannel();
    }
  }

  disconnectedCallback() {
    this.unsubscribeFromMessageChannel();
  }

  subscribeToMessageChannel() {
    if (!this.subscription && this.messageContext) {
      console.log("qHeader subscribing to message channel");
      this.subscription = subscribe(
        this.messageContext,
        QUEST_PATH_STEP,
        (message) => this.handleMessage(message)
      );
    } else if (!this.messageContext) {
      console.log("qHeader messageContext not available yet");
    }
  }

  unsubscribeFromMessageChannel() {
    if (this.subscription) {
      unsubscribe(this.subscription);
      this.subscription = null;
    }
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
