import { EventEmitter } from "events";
import { isObject, getPageUrl, getUvLabel, getUserSessionLabel } from "./util";

export class MyEmitter extends EventEmitter {
  private globalData: any;

  constructor() {
    super();
    this.init();
  }

  private basicEmit(event: string | symbol, ...args: any[]): boolean {
    const [data, ...rest] = args;

    if (!isObject(data)) {
      return super.emit(event, ...args);
    }

    if (typeof data.beforeEmit === "function") {
      data.beforeEmit.call(this, data);
      Reflect.deleteProperty(data, "beforeEmit");
    }

    return super.emit(event, data, ...rest);
  }

  // Emit an event with decorated data
  public customEmit(event: string | symbol, ...args: any[]): boolean {
    const [data, ...rest] = args;
    return this.basicEmit(
      event,
      {
        ...data,
        beforeEmit: (data: any) => {
          this.decorateData(data);
        }
      },
      ...rest
    );
  }

  private decorateData(data: any) {
    data.time = Date.now();
    data.globalData = this.globalData;

    if (!data.title) {
      data.title = document.title;
    }

    if (!data.url) {
      data.url = getPageUrl();
    }

    if (!data.preUrl) {
      data.preUrl =
        document.referrer && document.referrer !== location.href
          ? document.referrer
          : "";
    }

    if (!data.uvLabel) {
      data.uvLabel = getUvLabel();
    }

    if (!data.userLabel) {
      data.userLabel = getUserSessionLabel();
    }
  }

  init() {
    this.globalData = {};
    this.on("_globalDataChange", (globalData) => {
      this.globalData = globalData;
    });
  }
}

export const myEmitter = new MyEmitter();
