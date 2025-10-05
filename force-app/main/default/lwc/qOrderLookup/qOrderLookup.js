import { LightningElement, api } from "lwc";

/**
 * Quest Order Lookup Component
 *
 * @api {String} title - Main heading text (default: "Order look up")
 * @api {String} instructionText - Instructional text above input (default: "You can look up your tests using your order number you received in your order confirmation mail.")
 * @api {String} placeholder - Input field placeholder (default: "Order number")
 * @api {String} buttonText - Button text (default: "Find My Tests")
 * @api {String} supportTitle - Support section title (default: "Can't find your order?")
 * @api {String} supportText - Support section text (default: "You can find the order number in your purchase confirmation email. If you have any questions or need assistance, our support team is here to help.")
 * @api {String} supportLinkText - Support link text (default: "support team")
 * @api {String} supportLinkUrl - Support link URL (default: "#")
 * @api {String} customClass - Additional CSS classes for the container
 *
 * Example usage:
 * <c-q-order-lookup
 *   title="Find Your Order"
 *   button-text="Search Orders"
 *   support-link-url="/support">
 * </c-q-order-lookup>
 */
export default class QOrderLookup extends LightningElement {
  @api title = "Order look up";
  @api instructionText =
    "You can look up your tests using your order number you received in your order confirmation mail.";
  @api placeholder = "Order number";
  @api buttonText = "Find My Tests";
  @api supportTitle = "Can't find your order?";
  @api supportText =
    "You can find the order number in your purchase confirmation email. If you have any questions or need assistance, our support team is here to help.";
  @api supportLinkText = "support team";
  @api supportLinkUrl = "#";
  @api customClass = "";

  orderNumber = "";

  get containerClass() {
    return `q-order-lookup ${this.customClass}`.trim();
  }

  get hasOrderNumber() {
    return this.orderNumber && this.orderNumber.trim().length > 0;
  }

  get isButtonDisabled() {
    return !this.hasOrderNumber;
  }

  handleOrderNumberChange(event) {
    this.orderNumber = event.target.value;
  }

  handleFindTests() {
    if (!this.hasOrderNumber) {
      return;
    }

    // Emit custom event with order number
    const findEvent = new CustomEvent("findtests", {
      detail: {
        orderNumber: this.orderNumber,
      },
    });
    this.dispatchEvent(findEvent);
  }

  handleSupportClick() {
    // Emit custom event for support link
    const supportEvent = new CustomEvent("supportclick", {
      detail: {
        url: this.supportLinkUrl,
      },
    });
    this.dispatchEvent(supportEvent);
  }
}
