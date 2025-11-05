import {GenericCallback} from "../types";
import {generateGenerationIdFromPrompt} from "./ai";

export enum LongPollingHandlerResult {
  Event = 'event',
  Timeout = 'timeout',
}

class LongPollingHandler {
  private listeners: {[eventName: string]: {fn: Function, timeoutId: NodeJS.Timeout}} = {};

  backgroundExecute(execution: (callback: GenericCallback) => void, callback: GenericCallback, timeout: number, longPollingId: string): void {
    const submissionId = longPollingId ?? generateGenerationIdFromPrompt(String(Math.random()));
    const eventName = `execution-${submissionId}`;
    console.log('background exec', {execution, callback, timeout, longPollingId});

    if (!longPollingId) {
      console.log('start exec');
      execution((error, result) => {
        this.fireEvent(eventName, {error, result});
        console.log('send callback result');
        // callback(error, result);
      });
    }

    console.log('start wait for event');
    this.waitForEvent(eventName, timeout)
      .then(({longPollingResult, result}) => {
        console.log('end wait for event', {longPollingResult, result})
        if (LongPollingHandlerResult.Event === longPollingResult) {
          callback(result.error, result.result);
        } else {
          callback(null, {
            longPolling: true,
            longPollingFollowUpId: submissionId,
          })
        }
      });
  }

  waitForEvent(eventName: string, timeout: number): Promise<{longPollingResult: LongPollingHandlerResult, result?: any}> {
    return new Promise(resolve => {
      const timeoutId = setTimeout(() => {
        resolve({longPollingResult: LongPollingHandlerResult.Timeout});
      }, timeout);

      this.register(eventName, timeoutId, resolve);
    });
  }

  fireEvent(eventName: string, result: any): void {
    console.log('fire event', {eventName, result})
    if (!(eventName in this.listeners)) {
      return;
    }

    const {fn} = this.listeners[eventName];
    this.unregister(eventName);
    fn({longPollingResult: LongPollingHandlerResult.Event, result});
  }

  register(eventName: string, timeoutId: NodeJS.Timeout, listener: Function): void {
    this.listeners[eventName] = {fn: listener, timeoutId};
  }

  unregister(eventName: string): void {
    const {timeoutId} = this.listeners[eventName];
    clearTimeout(timeoutId);
    delete this.listeners[eventName];
  }
}

export const longPollingHandler = new LongPollingHandler();
