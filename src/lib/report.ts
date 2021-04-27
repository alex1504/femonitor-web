import stringify from "json-stringify-safe";
import { IData, ITrackerOptions } from "./monitor";
import { ErrorCombine } from "./monitor";

export type ErrorList = Array<ErrorCombine>;

export interface IReportParams {
  errorList: ErrorList;
}

export interface AjaxParams {
  url: string;
  data: any;
}
export class Reporter {
  private _data: IData;

  private _options: any;

  constructor(options: ITrackerOptions, data: IData) {
    this._data = data;
    this._options = options;
  }

  ajax(ajaxParams: AjaxParams): void {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", ajaxParams.url, true);
    xhr.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    xhr.send(ajaxParams.data);
  }

  private getReportData(list: any[]) {
    return list.map((item) => {
      Reflect.deleteProperty(item, "context");
      return item;
    });
  }

  reportErrors(errorList: ErrorList): void {
    if (!errorList.length) return;

    const { reportUrl } = this._options;
    const reportData = this.getReportData(errorList);

    this.ajax({
      url: reportUrl,
      data: stringify(reportData)
    });
  }
}
