import { IErrorOptions, ITrackerOptions } from "./monitor";
import { TrackerEvents, BaseError, ErrorType } from "../types/index";
import { myEmitter } from "./event";
import ErrorStackParser from "error-stack-parser";
import stringify from "json-stringify-safe";

export interface IError extends BaseError {
  msg: string | Event;
  line: number | undefined;
  column: number | undefined;
  stackTrace: string;
}

export interface IUnHandleRejectionError extends BaseError {
  msg: string;
}

export interface ICacheError {
  [errorMsg: string]: number;
}

export class ErrorObserver {
  public _options;
  private _cacheError: ICacheError;

  constructor(options: ITrackerOptions) {
    this._cacheError = {};
    this._options = options;
  }

  init(): void {
    const self = this;
    const oldOnError = window.onerror;
    const oldUnHandleRejection = window.onunhandledrejection;

    window.onerror = function (...args) {
      if (oldOnError) {
        oldOnError(...args);
      }

      const [msg, url, line, column, error] = args;

      const stackTrace = error ? ErrorStackParser.parse(error) : [];
      const msgText = typeof msg === "string" ? msg : msg.type;
      const errorObj: IError = {
        msg: msgText,
        url,
        line,
        column,
        stackTrace: stringify(stackTrace),
        errorType: ErrorType.jsError,
        context: this
      };

      if (typeof self._cacheError[msgText] !== "number") {
        self._cacheError[msgText] = 0;
      } else {
        self._cacheError[msgText] += 1;
      }

      // Repeated error events emit limit
      const repeat = (self._options.error as IErrorOptions).repeat;
      if (self._cacheError[msgText] < repeat) {
        myEmitter.customEmit(TrackerEvents.jsError, errorObj);
      }
    };

    window.onunhandledrejection = function (error: PromiseRejectionEvent) {
      if (oldUnHandleRejection) {
        oldUnHandleRejection.call(window, error);
      }

      const errorObj: IUnHandleRejectionError = {
        msg: error.reason,
        errorType: ErrorType.unHandleRejectionError,
        context: this
      };
      myEmitter.customEmit(TrackerEvents.unHandleRejection, errorObj);
    };

    window.addEventListener(
      "error",
      function (event) {
        const target: any = event.target || event.srcElement;
        const isElementTarget =
          target instanceof HTMLScriptElement ||
          target instanceof HTMLLinkElement ||
          target instanceof HTMLImageElement;
        if (!isElementTarget) return false;

        const url = target.src || target.href;

        const errorObj: BaseError = {
          url,
          errorType: ErrorType.resourceError,
          context: this
        };
        myEmitter.customEmit(TrackerEvents.resourceError, errorObj);
      },
      true
    );
  }
}
