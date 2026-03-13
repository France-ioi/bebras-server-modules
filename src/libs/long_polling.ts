import {GenericCallback} from "../types";
import {generateGenerationIdFromPrompt} from "./ai";

export enum LongPollingHandlerResult {
  Event = 'event',
  Timeout = 'timeout',
}

interface SubmissionData {
  pending?: boolean;
  result?: {error: unknown, result: unknown};
  listener?: {fn: Function, timeoutId: NodeJS.Timeout};
}

class LongPollingHandler {
  private submissionData: {[submissionId: string]: SubmissionData} = {};

  backgroundExecute(execution: (callback: GenericCallback) => void, callback: GenericCallback, timeout: number, longPollingId: string): void {
    const submissionId = longPollingId ?? generateGenerationIdFromPrompt(String(Math.random()));

    // make sure the listener is registered *before* execution
    const eventPromise = this.waitForEvent(submissionId, timeout);

    if (!longPollingId) {
      this.submissionData[submissionId] ||= {};
      this.submissionData[submissionId].pending = true;

      execution((error, result) => {
        this.fireEvent(submissionId, {error, result});
      });
    }

    if (this.submissionData[submissionId]?.result) {
      const result = this.submissionData[submissionId].result;
      callback(result.error, result.result);

      return;
    }

    if (!this.submissionData[submissionId]?.pending) {
      callback(new Error("This submission is not pending and the result is not available anymore."));

      return;
    }

    eventPromise.then(({longPollingResult, result}) => {
      if (LongPollingHandlerResult.Event === longPollingResult) {
        callback(result.error, result.result);
      } else {
        callback(null, {
          longPolling: true,
          longPollingFollowUpId: submissionId,
        });
      }
    });
  }

  waitForEvent(submissionId: string, timeout: number): Promise<{longPollingResult: LongPollingHandlerResult, result?: any}> {
    return new Promise(resolve => {
      const timeoutId = setTimeout(() => {
        resolve({longPollingResult: LongPollingHandlerResult.Timeout});
      }, timeout);

      this.register(submissionId, timeoutId, resolve);
    });
  }

  fireEvent(submissionId: string, result: any): void {
    const listener = this.submissionData[submissionId]?.listener;
    if (listener) {
      const {fn} = listener;
      this.unregister(submissionId);
      fn({longPollingResult: LongPollingHandlerResult.Event, result});
    }

    // Keep the result in the memory cache during 10 secs in case the client wants it again
    // or if the event was fired between two pollings
    this.submissionData[submissionId].pending = false;
    this.submissionData[submissionId].result = result;
    setTimeout(() => {
      delete this.submissionData[submissionId];
    }, 10000);
  }

  register(submissionId: string, timeoutId: NodeJS.Timeout, listener: Function): void {
    this.submissionData[submissionId] ||= {};
    this.submissionData[submissionId].listener = {fn: listener, timeoutId};
  }

  unregister(submissionId: string): void {
    const listener = this.submissionData[submissionId].listener;
    if (!listener) {
      return;
    }

    clearTimeout(listener.timeoutId);
    this.submissionData[submissionId].listener = undefined;
  }
}

export const longPollingHandler = new LongPollingHandler();
