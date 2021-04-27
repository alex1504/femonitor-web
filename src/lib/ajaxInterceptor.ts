import { ITrackerOptions } from "./monitor";
import {
  TrackerEvents,
  IReqEndRes,
  IHttpReqErrorRes,
  ErrorType
} from "../types/index";
import { myEmitter } from "./event";

export interface IAjaxReqStartRes {
  context: any;
}

export class AjaxInterceptor {
  private _options;

  constructor(options: ITrackerOptions) {
    this._options = options;
  }

  init(): void {
    if (!XMLHttpRequest) return;

    const self = this;
    const { open } = XMLHttpRequest.prototype;
    const { send } = XMLHttpRequest.prototype;

    XMLHttpRequest.prototype.open = function (method: string, url: string) {
      this._url = url;
      this._method = method;

      const reqStartRes: IAjaxReqStartRes = {
        context: this
      };

      myEmitter.customEmit(TrackerEvents.reqStart, reqStartRes);

      return open.call(this, method, url, true);
    };

    XMLHttpRequest.prototype.send = function (...rest: any[]) {
      const body = rest[0];
      const requestData: string = body;
      const startTime = Date.now();

      this.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
          if (this.status >= 200 && this.status < 300) {
            const reqEndRes: IReqEndRes = {
              duration: Date.now() - startTime,
              requestUrl: this.responseURL,
              response: this.response,
              context: this,
              status: this.status
            };

            myEmitter.customEmit(TrackerEvents.reqEnd, reqEndRes);
          } else {
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
              myEmitter.customEmit(TrackerEvents.reqError, reqErrorObj);
            }
          }
        }
      });
      return send.call(this, body);
    };
  }
}
