import { LightningElement } from "lwc";
import qPublisher from "c/qPublisher";
import QUEST_PATH_STEP from "@salesforce/messageChannel/qPathStep__c";

export default class QPath extends qPublisher(LightningElement) {
  currentStep = "step1";

  connectedCallback() {
    super.connectedCallback();
    // Set step1 as initially selected
    this.publishStepChange("step1");
  }

  handleStepClick(event) {
    console.log("qPath handleStepClick - event.target:", event.target);
    console.log(
      "qPath handleStepClick - event.currentTarget:",
      event.currentTarget
    );
    console.log(
      "qPath handleStepClick - dataset:",
      event.currentTarget.dataset
    );
    const step = event.currentTarget.dataset.step;
    console.log("qPath handleStepClick - step:", step);
    this.currentStep = step;
    this.publishStepChange(step);
  }

  publishStepChange(step) {
    const message = {
      currentStep: step,
    };
    console.log("qPath publishing message:", JSON.stringify(message));
    this.publishMessage(QUEST_PATH_STEP, message);
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
