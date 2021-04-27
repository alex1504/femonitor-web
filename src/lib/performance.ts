import { TrackerEvents } from "../types/index";
import { myEmitter } from "./event";

export interface IPerformanceInfo<type> {
  dnsLkTime: type;
  tcpConTime: type;
  reqTime: type;
  domParseTime: type;
  domReadyTime: type;
  loadTime: type;
  fpTime: type;
  fcpTime: type;
}

export class PerformanceObserver {
  private performance: Performance;

  private timingInfo: PerformanceTiming;

  constructor() {
    if (!window.performance || !window.performance.timing) {
      console.warn("Your browser does not suppport performance api.");
      return;
    }
    
    this.performance = window.performance;
    this.timingInfo = this.performance.timing;
  }

  private isDataExist(entry: any): boolean {
    return (
      entry && entry.loadEventEnd && entry.responseEnd && entry.domComplete
    );
  }

  /**
   * 异步检测performance数据是否完备
   */
  private check() {
    const entry = this.performance.getEntriesByType("navigation")[0];
    if (this.isDataExist(entry)) {
      this.getPerformanceData();
    } else setTimeout(this.check.bind(this), 0);
  }

  private getPerformanceData() {
    const {
      domainLookupEnd,
      domainLookupStart,
      connectEnd,
      connectStart,
      responseEnd,
      requestStart,
      domComplete,
      domInteractive,
      domContentLoadedEventEnd,
      loadEventEnd,
      navigationStart,
      responseStart,
      fetchStart
    } = this.timingInfo;

    const dnsLkTime = domainLookupEnd - domainLookupStart;
    const tcpConTime = connectEnd - connectStart;
    const reqTime = responseEnd - requestStart;
    const domParseTime = domComplete - domInteractive;
    const domReadyTime = domContentLoadedEventEnd - fetchStart;
    const loadTime = loadEventEnd - navigationStart;
    const fpTime = responseStart - fetchStart;
    const fcpTime = domComplete - fetchStart;

    const performanceInfo: IPerformanceInfo<number> = {
      dnsLkTime,
      tcpConTime,
      reqTime,
      domParseTime,
      domReadyTime,
      loadTime,
      fpTime,
      fcpTime
    };

    myEmitter.emit(TrackerEvents.performanceInfoReady, performanceInfo);
  }

  init(): void {
    this.check();
  }
}
