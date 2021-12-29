import { VueConstructor } from "vue";
import ErrorStackParser from "error-stack-parser";
import stringify from "json-stringify-safe";
import { BaseError, ErrorType, TrackerEvents } from "../types/index";
import { ITrackerOptions } from "./monitor";
import { BaseErrorObserver } from "./baseErrorObserver";

export interface IVueError extends BaseError {
  info: string | undefined;
  propsData: any;
  componentName: string | undefined;
  msg: string;
  stackTrace: string;
  componentNameTrace: string[];
}

export interface ISimpleVueError extends BaseError {
  msg: string;
  stackTrace: string;
}

export class VueErrorObserver extends BaseErrorObserver {
  constructor(Vue: VueConstructor, options: ITrackerOptions) {
    super(options);

    this.init(Vue);
  }

  init(Vue: VueConstructor): void {
    Vue.config.errorHandler = (err, vm, info) => {
      const stackTrace = err ? ErrorStackParser.parse(err) : [];
      const errorMsg = err.message;
      const errorType = ErrorType.vueJsError;

      try {
        if (vm) {
          const componentName = this.formatComponentName(vm);
          const componentNameTrace = this.getComponentNameTrace(vm);
          const propsData = vm.$options && vm.$options.propsData;
          const errorObj: IVueError = {
            errorType: errorType,
            msg: errorMsg,
            stackTrace: stringify(stackTrace),
            componentName: componentName,
            propsData: propsData,
            info: info,
            componentNameTrace
          };

          this.safeEmitError(
            `${errorType}: ${errorMsg}`,
            TrackerEvents.vuejsError,
            errorObj
          );
        } else {
          const errorObj: ISimpleVueError = {
            errorType: errorType,
            msg: errorMsg,
            stackTrace: stringify(stackTrace)
          };

          this.safeEmitError(
            `${errorType}: ${errorMsg}`,
            TrackerEvents.vuejsError,
            errorObj
          );
        }
      } catch (error) {
        throw new Error(typeof error === "string" ? error : "");
      }
    };
  }

  getComponentNameTrace(vm: any) {
    const compTrace = [this.formatComponentName(vm)];
    while (vm.$parent) {
      vm = vm.$parent;
      compTrace.unshift(this.formatComponentName(vm));
    }

    return compTrace;
  }

  formatComponentName(vm: any) {
    try {
      if (vm.$root === vm) return "root";

      const name = vm._isVue
        ? (vm.$options && vm.$options.name) ||
          (vm.$options && vm.$options._componentTag)
        : vm.name;
      return (
        (name ? "component <" + name + ">" : "anonymous component") +
        (vm._isVue && vm.$options && vm.$options.__file
          ? " at " + (vm.$options && vm.$options.__file)
          : "")
      );
    } catch (error) {
      throw new Error(typeof error === "string" ? error : "");
    }
  }
}
