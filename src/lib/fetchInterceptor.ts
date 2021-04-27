import { ITrackerOptions } from "./monitor";
import {
  TrackerEvents,
  IReqEndRes,
  ErrorType,
  IHttpReqErrorRes
} from "../types/index";
import { myEmitter } from "./event";

export interface IFetchReqStartRes {
  url: string;
  options: any;
  context?: any;
}

export class FetchInterceptor {
  private _options;

  constructor(options: ITrackerOptions) {
    this._options = options;
  }

  init(): void {
    const self = this;
    const originFetch = fetch;

    Object.defineProperty(window, "fetch", {
      configurable: true,
      enumerable: true,
      get() {
        return (url: string, options: any = {}) => {
          this._url = url;
          this._method = options.method || "get";
          this._data = options.body;

          const startTime: number = Date.now();
          const reqStartRes: IFetchReqStartRes = {
            url,
            options
          };
          myEmitter.customEmit(TrackerEvents.reqStart, reqStartRes);

          return originFetch(url, options)
            .then((res) => {
              const status = res.status;
              const reqEndRes: IReqEndRes = {
                requestUrl: res.url,
                requestMethod: this._method,
                requestData: this._data,
                response: res.json(),
                duration: Date.now() - startTime,
                context: this,
                status
              };

              const reqErrorRes: IHttpReqErrorRes = {
                requestMethod: this._method,
                requestUrl: this._url,
                requestData: this._data,
                errorMsg: res.statusText,
                errorType: ErrorType.httpRequestError
              };

              if (status >= 200 && status < 300) {
                myEmitter.customEmit(TrackerEvents.reqEnd, reqEndRes);
              } else {
                if (this._url !== self._options.reportUrl) {
                  myEmitter.customEmit(TrackerEvents.reqError, reqErrorRes);
                }
              }

              return Promise.resolve(res);
            })
            .catch((e: Error) => {
              const reqErrorRes: IHttpReqErrorRes = {
                requestMethod: this._method,
                requestUrl: this._url,
                requestData: this._data,
                errorMsg: e.message,
                errorType: ErrorType.httpRequestError
              };

              if (this._url !== self._options.reportUrl) {
                myEmitter.customEmit(TrackerEvents.reqError, reqErrorRes);
              }
            });
        };
      }
    });
  }
}
