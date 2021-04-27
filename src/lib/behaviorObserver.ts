import { ConsoleType, ITrackerOptions } from "./monitor";
import { myEmitter } from "./event";
import { TrackerEvents } from "../types";
import stringify from "json-stringify-safe";

export type BehaviorCombine = IConsoleBehavior | IClickBehavior;

export interface IConsoleBehavior {
  type: "console";
  level: ConsoleType;
  msg: string;
}

export interface IClickBehavior {
  type: "click";
  eleClass: string;
  classPath: string;
  xpath: string;
  screenX: number;
  screenY: number;
}

export class BehaviorObserver {
  private _options;
  private _isConsoleTrack = true;

  constructor(options: ITrackerOptions) {
    this._options = options;
  }

  init(): void {
    this.hackConsole();
    this.handleConsoleSwitch();
    this.listenClickEvent();
  }
  private handleConsoleSwitch() {
    myEmitter.on(TrackerEvents._onConsoleTrack, () => {
      this._isConsoleTrack = true;
    });

    myEmitter.on(TrackerEvents._offConsoleTrack, () => {
      this._isConsoleTrack = false;
    });
  }

  private hackConsole() {
    const self = this;
    if (!window || !window.console) return;

    const consoleTypes = this._options.behavior?.console;
    consoleTypes?.forEach((type) => {
      const action = window.console[type];
      window.console[type] = function (...rest: any[]) {
        const msg = Array.from(rest);
        const consoleBehavior: IConsoleBehavior = {
          type: "console",
          level: type,
          msg: stringify(msg)
        };

        // Prevent catch console behavior inside eventEmitter event handlers
        if (self._isConsoleTrack) {
          myEmitter.emit(TrackerEvents._console, consoleBehavior);
        }

        return typeof action === "function" && action.call(null, ...rest);
      };
    });
  }

  private _globalClickHandler(e: MouseEvent) {
    const target = e.target;

    if (target instanceof HTMLElement) {
      const eleClass = target.className;
      const classPath = this.getElePath(target);
      const xpath = this.getXPathFromElement(target);
      const clickBehavior: IClickBehavior = {
        type: "click",
        eleClass,
        classPath,
        xpath,
        screenX: e.screenX,
        screenY: e.screenY
      };

      myEmitter.emit(TrackerEvents._clickEle, clickBehavior);
    }
  }

  private normalTarget(node: HTMLElement) {
    let t, n, r, a, i;

    const o = [];
    if (!node || !node.tagName) return "";
    if (
      (o.push(node.tagName.toLowerCase()),
      node.id && o.push("#".concat(node.id)),
      (t = node.className) &&
        "[object String]" === Object.prototype.toString.call(t))
    ) {
      for (n = t.split(/\s+/), i = 0; i < n.length; i++) {
        // If className include active string, don't add to path
        if (n[i].indexOf("active") < 0) o.push(".".concat(n[i]));
      }
    }
    const s = ["type", "name", "title", "alt"];
    for (i = 0; i < s.length; i++)
      (r = s[i]),
        (a = node.getAttribute(r)) &&
          o.push("[".concat(r, '="').concat(a, '"]'));
    return o.join("");
  }

  /**
   * Get element path for maxDeepLen at most
   */
  private getElePath(node: HTMLElement, maxDeepLen = 5): string {
    if (!node || 1 !== node.nodeType) return "";
    const ret = [];
    let deepLength = 0, 
      elm = "";       

    ret.push(`(${node.innerText.substr(0, 50)})`);
    for (
      let t: any = node || null;
      t && deepLength++ < maxDeepLen && !("html" === (elm = this.normalTarget(t)));

    ) {
      ret.push(elm), (t = t.parentNode);
    }
    return ret.reverse().join(" > ");
  }
  
  private getXPathFromElement(elm: any): string {
    const allNodes = document.getElementsByTagName("*");
    const segs = [];
    for (; elm && elm.nodeType == 1; elm = elm.parentNode) {
      if (elm.hasAttribute("id")) {
        let uniqueIdCount = 0;
        for (let n = 0; n < allNodes.length; n++) {
          if (allNodes[n].hasAttribute("id") && allNodes[n].id == elm.id)
            uniqueIdCount++;
          if (uniqueIdCount > 1) break;
        }
        if (uniqueIdCount == 1) {
          segs.unshift('id("' + elm.getAttribute("id") + '")');
          return segs.join("/");
        } else {
          segs.unshift(
            elm.localName.toLowerCase() +
              '[@id="' +
              elm.getAttribute("id") +
              '"]'
          );
        }
      } else if (elm.hasAttribute("class")) {
        segs.unshift(
          elm.localName.toLowerCase() +
            '[@class="' +
            elm.getAttribute("class") +
            '"]'
        );
      } else {
        let i, sib;
        for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) {
          if ((sib as any).localName == elm.localName) i++;
        }
        segs.unshift(elm.localName.toLowerCase() + "[" + i + "]");
      }
    }
    return segs.length ? "/" + segs.join("/") : "";
  }

  listenClickEvent() {
    if (window.removeEventListener) {
      window.removeEventListener(
        "click",
        this._globalClickHandler.bind(this),
        false
      );
    }

    window.addEventListener(
      "click",
      this._globalClickHandler.bind(this),
      false
    );
  }
}
