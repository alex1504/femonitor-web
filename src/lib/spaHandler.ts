import { myEmitter } from "./event";

export class SpaHandler {
  private static instance: SpaHandler;

  public static init(): SpaHandler {
    if (SpaHandler.instance) {
      return SpaHandler.instance;
    }

    return new SpaHandler();
  }

  constructor() {
    this.hackState("pushState");
    this.hackState("replaceState");

    window.addEventListener("hashchange", (...rest) => {
      myEmitter.emit("_spaHashChange", ...rest);
    });
    window.addEventListener("historystatechanged", (...rest) => {
      myEmitter.emit("_spaHashChange", ...rest);
    });
  }

  private hackState(fnName: "pushState" | "replaceState") {
    const func = window.history[fnName];
    if (typeof func === "function") {
      window.history[fnName] = function (...rest) {
        myEmitter.emit("_spaHashChange", ...rest);

        return func.apply(this, rest);
      };
    }
  }
}
