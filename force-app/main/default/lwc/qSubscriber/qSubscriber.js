import { LightningElement, wire } from "lwc";
import {
  subscribe,
  MessageContext,
  unsubscribe,
} from "lightning/messageService";

/**
 * Quest Subscriber Mixin
 * Provides subscription functionality for Lightning Message Service
 *
 * Usage:
 * import qSubscriber from 'c/qSubscriber';
 *
 * export default class MyComponent extends qSubscriber(LightningElement) {
 *   connectedCallback() {
 *     super.connectedCallback();
 *     this.subscribeToChannel('myChannel', (message) => {
 *       console.log('Received:', message);
 *     });
 *   }
 * }
 */
export default function qSubscriber(Base) {
  return class extends Base {
    subscription = null;

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
      // Call parent connectedCallback if it exists
      if (super.connectedCallback) {
        super.connectedCallback();
      }
      this.retrySubscription();
    }

    renderedCallback() {
      if (super.renderedCallback) {
        super.renderedCallback();
      }
      this.retrySubscription();
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }
      this.unsubscribeFromChannel();
    }

    /**
     * Subscribe to a Lightning Message Channel
     * @param {string} channel - The message channel to subscribe to
     * @param {function} callback - The callback function to handle messages
     */
    subscribeToChannel(channel, callback) {
      this.channel = channel;
      this.messageCallback = callback;
      this.retrySubscription();
    }

    retrySubscription() {
      if (
        !this.subscription &&
        this.messageContext &&
        this.channel &&
        this.messageCallback
      ) {
        this.subscription = subscribe(
          this.messageContext,
          this.channel,
          this.messageCallback
        );
      }
    }

    /**
     * Unsubscribe from the current channel
     */
    unsubscribeFromChannel() {
      if (this.subscription) {
        unsubscribe(this.subscription);
        this.subscription = null;
      }
    }
  };
}
