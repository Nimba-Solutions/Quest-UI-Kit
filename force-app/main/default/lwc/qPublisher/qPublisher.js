import { LightningElement, wire } from "lwc";
import { publish, MessageContext } from "lightning/messageService";

/**
 * Quest Publisher Mixin
 * Provides publish functionality for Lightning Message Service
 *
 * Usage:
 * import qPublisher from 'c/qPublisher';
 *
 * export default class MyComponent extends qPublisher(LightningElement) {
 *   connectedCallback() {
 *     super.connectedCallback();
 *     this.publishMessage('myChannel', { data: 'value' });
 *   }
 * }
 */
export default function qPublisher(Base) {
  return class extends Base {
    @wire(MessageContext)
    messageContext;

    connectedCallback() {
      // Call parent connectedCallback if it exists
      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }

    /**
     * Publish a message to a Lightning Message Channel
     * @param {string} channel - The message channel to publish to
     * @param {object} message - The message payload
     */
    publishMessage(channel, message) {
      if (this.messageContext) {
        publish(this.messageContext, channel, message);
      } else {
        console.warn("MessageContext not available for publishing");
      }
    }
  };
}
