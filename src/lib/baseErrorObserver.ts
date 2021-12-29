import { IErrorOptions, ITrackerOptions } from "./monitor";
import { BaseError } from "../types/index";
import { myEmitter } from "./event";

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

export class BaseErrorObserver {
  public _options;
  private _cacheError: ICacheError;

  constructor(options: ITrackerOptions) {
    this._cacheError = {};
    this._options = options;
  }

  /**
   * Emit same error not more than repeated times, to prevent dead cycle
   */
  safeEmitError(
    cacheKey: string,
    errorType: string,
    errorObj: IError | BaseError | IUnHandleRejectionError
  ) {
    if (typeof this._cacheError[cacheKey] !== "number") {
      this._cacheError[cacheKey] = 0;
    } else {
      this._cacheError[cacheKey] += 1;
    }

    const repeat = (this._options.error as IErrorOptions).repeat;
    if (this._cacheError[cacheKey] < repeat) {
      myEmitter.emitWithGlobalData(errorType, errorObj);
    } else {
      console.warn(
        "The error has reached the preset number of repetitions",
        errorObj
      );
    }
  }
}
