import { LightningElement, api } from "lwc";
import qPublisher from "c/qPublisher";
import QUEST_PATH_STEP from "@salesforce/messageChannel/qPathStep__c";

/**
 * Parameterized Quest Path Component
 *
 * @api {Array} steps - Array of step objects with id, label, and completed properties
 * @api {String} initialStep - The step ID to start with (default: "step1")
 * @api {Boolean} allowNavigation - Whether steps are clickable (default: true, set to false to disable)
 * @api {String} customClass - Additional CSS classes to apply to the container
 * @api {String} backgroundColor - Background color of the path container (default: "#f3f3f3")
 * @api {String} currentStepColor - Color of the current/selected step (default: "#0176d3")
 * @api {String} hoverColor - Color when hovering over steps (default: "#e5f3ff")
 *
 * Example usage:
 * <c-q-path
 *   steps={customSteps}
 *   initial-step="step2"
 *   allow-navigation={false}
 *   custom-class="my-custom-path"
 *   background-color="#f8f9fa"
 *   current-step-color="#28a745"
 *   hover-color="#d4edda">
 * </c-q-path>
 */
export default class QPath extends qPublisher(LightningElement) {
  @api steps = [
    { id: "step1", label: "Step 1", completed: true },
    { id: "step2", label: "Step 2", completed: true },
    { id: "step3", label: "Step 3", completed: true },
  ];
  @api initialStep = "step1";
  @api allowNavigation;
  @api customClass = "";
  @api backgroundColor = "white";
  @api currentStepColor = "#28a745";
  @api hoverColor = "#f8f9fa";

  currentStep = this.initialStep;

  connectedCallback() {
    super.connectedCallback();
    // Set initial step as selected
    this.currentStep = this.initialStep;
    this.publishStepChange(this.initialStep);
  }

  handleStepClick(event) {
    if (!this.isNavigationEnabled) {
      return;
    }

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

  get dynamicSteps() {
    return this.steps.map((step, index) => ({
      ...step,
      isSelected: this.currentStep === step.id,
      stepClass: this.currentStep === step.id ? "slds-is-current" : "",
      isClickable: this.isNavigationEnabled
        ? "slds-path__step--clickable"
        : "slds-path__step--disabled",
      stepNumber: index + 1,
    }));
  }

  get containerClass() {
    return `slds-path ${this.customClass}`.trim();
  }

  get containerStyle() {
    return `background-color: ${this.backgroundColor}; --qpath-current-color: ${this.currentStepColor}; --qpath-hover-color: ${this.hoverColor};`;
  }

  get isNavigationEnabled() {
    return this.allowNavigation !== false;
  }
}
