import { ITrackerOptions } from "./monitor";
import {
  TrackerEvents,
  IReqEndRes,
  IHttpReqErrorRes,
  ErrorType
} from "../types/index";
import { myEmitter } from "./event";
import { BaseObserver } from "./baseErrorObserver";

export interface IAjaxReqStartRes {
  context: any;
}

export class AjaxInterceptor extends BaseObserver {
  constructor(options: ITrackerOptions) {
    super(options);
    this._options = options;
  }

  init(): void {
    if (!XMLHttpRequest) return;

    const self = this;
    const { open } = XMLHttpRequest.prototype;
    const { send } = XMLHttpRequest.prototype;

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async?: boolean
    ) {
      this._url = typeof url === "string" ? url : url.href;
      this._method = method;
      this._isUrlInIgnoreList = self.isUrlInIgnoreList(this._url);

      const reqStartRes: IAjaxReqStartRes = {
        context: this
      };

      if (!this._isUrlInIgnoreList) {
        myEmitter.emitWithGlobalData(TrackerEvents.reqStart, reqStartRes);
      }

      return open.call(
        this,
        method,
        this._url,
        typeof async === "boolean" ? async : true
      );
    };

    XMLHttpRequest.prototype.send = function (...rest: any[]) {
      const body = rest[0];
      const requestData: string = body;
      const startTime = Date.now();

      this.addEventListener("readystatechange", function () {
        if (this._isUrlInIgnoreList) {
          return;
        }

        if (this.readyState === 4) {
          if (this.status >= 200 && this.status < 300) {
            const reqEndRes: IReqEndRes = {
              duration: Date.now() - startTime,
              requestUrl: this.responseURL,
              response: this.response,
              context: this,
              status: this.status
            };

            myEmitter.emitWithGlobalData(TrackerEvents.reqEnd, reqEndRes);
          } else {
            const errorType = ErrorType.httpRequestError;
            const reqErrorObj: IHttpReqErrorRes = {
              requestMethod: this._method,
              requestUrl: this._url,
              requestData,
              errorType: ErrorType.httpRequestError,
              context: this,
              status: this.status
            };

            // If http error url match reportUrl, don't emit event
            if (this._url !== self._options.reportUrl) {
              self.safeEmitError(
                `${errorType}: ${this._url}`,
                TrackerEvents.reqError,
                reqErrorObj
              );
            }
          }
        }
      });
      return send.call(this, body);
    };
  }
}
