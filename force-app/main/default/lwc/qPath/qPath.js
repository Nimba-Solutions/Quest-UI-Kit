import { LightningElement, wire } from "lwc";
import { publish, MessageContext } from "lightning/messageService";
import QUEST_PATH_STEP from "@salesforce/messageChannel/qPathStep__c";

export default class QPath extends LightningElement {
  currentStep = "step1";

  @wire(MessageContext)
  messageContext;

  connectedCallback() {
    // Set step1 as initially selected
    this.publishStepChange("step1");
  }

  handleStepClick(event) {
    const step = event.target.dataset.step;
    this.currentStep = step;
    this.publishStepChange(step);
  }

  publishStepChange(step) {
    const message = {
      currentStep: step,
    };
    console.log("qPath publishing message:", JSON.stringify(message));
    publish(this.messageContext, QUEST_PATH_STEP, message);
  }

  get isStep1Selected() {
    return this.currentStep === "step1";
  }

  get isStep2Selected() {
    return this.currentStep === "step2";
  }

  get isStep3Selected() {
    return this.currentStep === "step3";
  }

  get step1Class() {
    return this.isStep1Selected ? "slds-is-current" : "";
  }

  get step2Class() {
    return this.isStep2Selected ? "slds-is-current" : "";
  }

  get step3Class() {
    return this.isStep3Selected ? "slds-is-current" : "";
  }
}
