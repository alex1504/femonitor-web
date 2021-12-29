export enum TrackerEvents {
  /* SDK expose events */
  performanceInfoReady = "performanceInfoReady",
  reqStart = "reqStart",
  reqEnd = "reqEnd",
  reqError = "reqError",
  jsError = "jsError",
  vuejsError = "vuejsError",
  unHandleRejection = "unHandleRejection",
  resourceError = "resourceError",
  batchErrors = "batchErrors",
  mouseTrack = "mouseTrack",
  event = "event",

  /* SDK inner events */
  _clickEle = "_clickEle",
  _console = "_console",
  _onConsoleTrack = "_onConsoleTrack",
  _offConsoleTrack = "_offConsoleTrack",
  _mouseTrack = "_mouseTrack",
  _initOptions = "_initOptions",
  _globalDataChange = "_globalDataChange"
}

export interface IReqEndRes {
  duration?: number;
  requestUrl?: string;
  response?: string | Promise<string>;
  context?: any;
  requestMethod?: string;
  requestData?: any;
  status: number;
}

export interface BaseError {
  url?: string | undefined;
  path?: string | undefined;
  errorType: ErrorType;
  context?: any;
}

export interface IHttpReqErrorRes extends BaseError {
  requestMethod: string | undefined;
  requestUrl: string | undefined;
  requestData: string | null;
  errorMsg?: string | undefined;
  status?: number;
}

export enum ErrorType {
  vueJsError = "vuejsError",
  jsError = "jsError",
  unHandleRejectionError = "unHandleRejectionError",
  resourceError = "resourceError",
  httpRequestError = "httpError"
}
