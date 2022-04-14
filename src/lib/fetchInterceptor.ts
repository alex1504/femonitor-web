import { ITrackerOptions } from "./monitor";
import {
  TrackerEvents,
  IReqEndRes,
  ErrorType,
  IHttpReqErrorRes
} from "../types/index";
import { myEmitter } from "./event";
import { BaseObserver } from "./baseErrorObserver";

export interface IFetchReqStartRes {
  url: string;
  options: any;
  context?: any;
}

export class FetchInterceptor extends BaseObserver {
  public _options;

  constructor(options: ITrackerOptions) {
    super(options);
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
          this._isUrlInIgnoreList = self.isUrlInIgnoreList(url);

          const startTime: number = Date.now();
          const reqStartRes: IFetchReqStartRes = {
            url,
            options
          };

          if (!this._isUrlInIgnoreList) {
            myEmitter.emitWithGlobalData(TrackerEvents.reqStart, reqStartRes);
          }

          return originFetch(url, options)
            .then((res) => {
              const status = res.status;
              const reqEndRes: IReqEndRes = {
                requestUrl: res.url,
                requestMethod: this._method,
                requestData: this._data,
                response: res,
                duration: Date.now() - startTime,
                context: this,
                status
              };

              const errorType = ErrorType.httpRequestError;
              const reqErrorRes: IHttpReqErrorRes = {
                requestMethod: this._method,
                requestUrl: this._url,
                requestData: this._data,
                errorMsg: res.statusText,
                errorType
              };

              if (!this._isUrlInIgnoreList) {
                if (status >= 200 && status < 300) {
                  myEmitter.emitWithGlobalData(TrackerEvents.reqEnd, reqEndRes);
                } else {
                  self.safeEmitError(
                    `${errorType}: ${this._url}`,
                    TrackerEvents.reqError,
                    reqErrorRes
                  );
                }
              }

              return Promise.resolve(res);
            })
            .catch((e: Error) => {
              const errorType = ErrorType.httpRequestError;
              const reqErrorRes: IHttpReqErrorRes = {
                requestMethod: this._method,
                requestUrl: this._url,
                requestData: this._data,
                errorMsg: e.message,
                errorType
              };

              if (!this._isUrlInIgnoreList) {
                self.safeEmitError(
                  `${errorType}: ${this._url}`,
                  TrackerEvents.reqError,
                  reqErrorRes
                );
              }
            });
        };
      }
    });
  }
}
