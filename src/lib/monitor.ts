import merge from "deepmerge";
import { VueConstructor } from "vue";
import { myEmitter } from "./event";
import {
  ErrorObserver,
  IError,
  IUnHandleRejectionError
} from "./errorObserver";
import { ISimpleVueError, IVueError } from "./vueErrorObserver";
import { AjaxInterceptor } from "./ajaxInterceptor";
import { VueErrorObserver } from "./vueErrorObserver";
import { FetchInterceptor } from "./fetchInterceptor";
import { IPerformanceInfo, PerformanceObserver } from "./performance";
import {
  BehaviorCombine,
  BehaviorObserver,
  IClickBehavior,
  IConsoleBehavior
} from "./behaviorObserver";
import { getDeviceInfo, IDeviceInfo } from "./device";
import { Reporter } from "./report";
import { TrackerEvents, IHttpReqErrorRes } from "../types";
import { isObject, getNetworkType } from "./util";
import packageJson from "../../package.json";
import { SpaHandler } from "./spaHandler";
import { RrwebObserver } from "./rrwebObserver";
import { eventWithTime } from "rrweb/typings/types";
import stringify from "json-stringify-safe";

export type ErrorCombine =
  | IError
  | ISimpleVueError
  | IVueError
  | IUnHandleRejectionError
  | IHttpReqErrorRes;

export enum Env {
  Dev = "dev",
  Sandbox = "sandbox",
  Production = "production"
}

export interface IErrorOptions {
  watch: boolean;
  random: number;
  repeat: number;
  delay: number;
}

export interface IHttpOptions {
  fetch: boolean;
  ajax: boolean;
}

export enum ConsoleType {
  log = "log",
  error = "error",
  warn = "warn",
  info = "info",
  debug = "debug"
}
export interface IBehaviorOption {
  watch: boolean;
  console: ConsoleType[];
  click: boolean;
  queueLimit: number;
}

export interface IRrwebOption {
  watch: boolean;
  queueLimit: number;
  delay: number;
}

export interface ITrackerOptions {
  env: Env;
  error: IErrorOptions;
  http: IHttpOptions;
  data: IData;
  reportUrl: string;
  performance: boolean;
  isSpa: boolean;
  behavior: IBehaviorOption;
  rrweb: IRrwebOption;
}

export type ITrackerOptionsKey = keyof ITrackerOptions;

export type Value = number | string | boolean | undefined;

export interface IConfigDataOptions {
  [key: string]: Value;
}

export type IData = Record<string, unknown>;

export const defaultTrackerOptions = {
  env: Env.Dev,
  reportUrl: "",
  data: {},
  error: {
    watch: true,
    random: 1,
    repeat: 5,
    delay: 1000
  },
  performance: false,
  http: {
    fetch: true,
    ajax: true
  },
  behavior: {
    watch: false,
    console: [ConsoleType.error],
    click: true,
    queueLimit: 20
  },
  /**
   * rrweb use mutation observer api, for compatibility see:
   * https://caniuse.com/mutationobserver
   */
  rrweb: {
    watch: false,
    queueLimit: 50,
    delay: 1000
  },
  isSpa: true
};

export type EventName = string | symbol;

export class Monitor {
  public static instance: Monitor;

  public errObserver: ErrorObserver;

  public ajaxInterceptor: AjaxInterceptor;

  public fetchInterceptor: FetchInterceptor;

  public performanceObserver: PerformanceObserver;

  public spaHandler: SpaHandler;

  public behaviorObserver: BehaviorObserver;

  public reporter: Reporter;

  public sdkVersion: string;

  public errorQueue: ErrorCombine[] = [];

  public behaviorQueue: BehaviorCombine[] = [];

  public rrwebQueue: eventWithTime[] = [];

  private readonly defaultOptions: ITrackerOptions = defaultTrackerOptions;

  public $data: IData = {};

  public $options: ITrackerOptions = this.defaultOptions;

  private errorQueueTimer: number | null;

  constructor(options: Partial<ITrackerOptions> | undefined) {
    this.initOptions(options);

    this.getDeviceInfo();
    this.getNetworkType();
    this.getUserAgent();

    this.initGlobalData();
    this.initInstances();
    this.initEventListeners();
  }

  /**
   * 初始化tracker实例，单例
   * @param options ITrackerOptions
   */
  static init(options: Partial<ITrackerOptions> | undefined = {}) {
    if (!this.instance) {
      this.instance = new Monitor(options);
    }

    return this.instance;
  }

  /**
   * 获取设备信息
   */
  getDeviceInfo(): void {
    const deviceInfo = getDeviceInfo();

    Object.keys(deviceInfo).forEach((key) => {
      this.configData({
        [`_${key}`]: deviceInfo[key as keyof IDeviceInfo]
      });
    });
  }

  getNetworkType(): void {
    const networkType = getNetworkType();
    this.configData({
      _networkType: networkType
    });
  }

  getUserAgent(): void {
    this.configData({
      _userAgent: navigator.userAgent
    });
  }

  /**
   * 初始化配置项
   */
  private initOptions(options: Partial<ITrackerOptions> | undefined): void {
    if (!options) options = {};

    this.$options = merge(this.$options, options);
  }

  private initGlobalData(): void {
    this.configData({
      _sdkVersion: packageJson.version,
      _env: this.$options.env,
      ...this.$options.data
    });
  }

  /**
   * Inject instances and init
   */
  initInstances(): void {
    this.reporter = new Reporter(this.$options, this.$data);

    if (this.$options.error.watch) {
      this.errObserver = new ErrorObserver(this.$options);
      this.errObserver.init();
    }

    if (this.$options.performance) {
      this.listenPerformanceInfo();
      this.performanceObserver = new PerformanceObserver();
      this.performanceObserver.init();
    }

    if (this.$options.http.fetch) {
      this.fetchInterceptor = new FetchInterceptor(this.$options);
      this.fetchInterceptor.init();
    }

    if (this.$options.http.ajax) {
      this.ajaxInterceptor = new AjaxInterceptor(this.$options);
      this.ajaxInterceptor.init();
    }

    if (this.$options.behavior.watch) {
      this.listenBehaviors();
      this.behaviorObserver = new BehaviorObserver(this.$options);
      this.behaviorObserver.init();
    }

    if (this.$options.rrweb.watch) {
      this.listenMouseTrack();
      new RrwebObserver().init();
    }

    if (this.$options.isSpa) {
      this.spaHandler = SpaHandler.init();
      myEmitter.on("_spaHashChange", (...rest) => {
        const [, , url] = rest;
        this.configData({
          _spaUrl: url
        });
      });
    }
  }

  private listenMouseTrack() {
    myEmitter.on(TrackerEvents._mouseTrack, (event: eventWithTime) => {
      if (this.rrwebQueue.length >= this.$options.rrweb.queueLimit) {
        this.rrwebQueue.shift();
      }
      this.rrwebQueue.push(event);

      setTimeout(() => {
        myEmitter.customEmit(TrackerEvents.mouseTrack, this.rrwebQueue);
      }, this.$options.rrweb.delay);
    });
  }

  private listenBehaviors() {
    myEmitter.on(TrackerEvents._console, (behavior: IConsoleBehavior) => {
      this.pushBehavior(behavior);
      this.configData("_behavior", this.behaviorQueue, false);
    });

    myEmitter.on(TrackerEvents._clickEle, (behavior: IClickBehavior) => {
      this.pushBehavior(behavior);
      this.configData("_behavior", this.behaviorQueue, false);
    });
  }

  private listenPerformanceInfo() {
    myEmitter.on(
      TrackerEvents.performanceInfoReady,
      (performanceInfo: IPerformanceInfo<number>) => {
        this.configData("_performance", stringify(performanceInfo), false);
      }
    );
  }

  private pushBehavior(behavior: BehaviorCombine) {
    if (this.behaviorQueue.length >= this.$options.behavior.queueLimit) {
      this.behaviorQueue.shift();
    }

    this.behaviorQueue.push(behavior);
  }

  /**
   * 设置全局数据
   */
  configData(
    key: string,
    value: Record<string, unknown> | string | number | Array<any>,
    deepmerge?: boolean
  ): Monitor;
  configData(options: Record<string, unknown>, deepmerge?: boolean): Monitor;
  configData(
    key: Record<string, unknown> | string,
    value:
      | Record<string, unknown>
      | string
      | number
      | boolean
      | Array<any> = true,
    deepmerge = true
  ): Monitor {
    if (typeof key === "string") {
      if (isObject(value) && deepmerge) {
        this.$data = merge(this.$data, value as Record<string, unknown>);
      } else {
        this.$data[key as string] = value;
      }
    } else if (isObject(key)) {
      if (typeof value !== "boolean") {
        throw new Error("deepmerge should be boolean");
      }

      deepmerge = value;
      value = key;
      if (deepmerge) {
        this.$data = merge(this.$data, value);
      } else {
        this.$data = {
          ...this.$data,
          ...value
        };
      }
    }

    myEmitter.emit("_globalDataChange", this.$data);

    return this;
  }

  public changeOptions(
    key: keyof ITrackerOptions,
    value: ITrackerOptions[keyof ITrackerOptions]
  ): void {
    this.$options = merge(this.$options, {
      [key]: value
    });
  }

  private handleErrorReport(): void {
    if (this.errorQueueTimer) return;

    this.errorQueueTimer = window.setTimeout(() => {
      if (this.$options.reportUrl) {
        this.reporter.reportErrors(this.errorQueue);
      }

      myEmitter.customEmit(TrackerEvents.batchErrors, {
        errorList: this.errorQueue
      });

      this.errorQueueTimer = null;
      this.errorQueue = [];
    }, this.$options.error?.delay);
  }

  private initEventListeners(): void {
    const errorEvents = [
      TrackerEvents.jsError,
      TrackerEvents.vuejsError,
      TrackerEvents.unHandleRejection,
      TrackerEvents.resourceError,
      TrackerEvents.reqError
    ];

    errorEvents.forEach((eventName) => {
      this.on(eventName, (error) => {
        // Extract sample from all errors
        const random = this.$options.error
          ? this.$options.error?.random
          : this.defaultOptions.error.random;
        const isRandomIgnore = Math.random() >= random;

        if (isRandomIgnore) return;

        this.errorQueue.push(error);
        this.handleErrorReport();
      });
    });
  }

  private _on(
    eventName: EventName,
    listener: (...args: any[]) => void,
    withEventName = false
  ) {
    myEmitter.on(eventName, async (...args) => {
      if (withEventName) {
        args.unshift(eventName);
      }

      myEmitter.emit(TrackerEvents._offConsoleTrack);

      await listener(...args);

      myEmitter.emit(TrackerEvents._onConsoleTrack);
    });

    return this;
  }

  on(
    event: EventName | Array<EventName>,
    listener: (...args: any[]) => void
  ): Monitor {
    if (event instanceof Array) {
      event.forEach((eventName) => {
        this._on(eventName, listener, true);
      });

      return this;
    }

    return this._on(event, listener);
  }

  once(event: EventName, listener: (...args: any[]) => void): Monitor {
    myEmitter.once(event, listener);

    return this;
  }

  off(event: EventName, listener: (...args: any[]) => void): Monitor {
    myEmitter.off(event, listener);

    return this;
  }

  removeAllListeners(event?: EventName | undefined): Monitor {
    myEmitter.removeAllListeners(event);

    return this;
  }

  emit(event: EventName, ...args: any[]): boolean {
    return myEmitter.customEmit(event, ...args);
  }

  useVueErrorListener(Vue: VueConstructor) {
    new VueErrorObserver(Vue);
  }
}
