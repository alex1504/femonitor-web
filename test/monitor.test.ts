import { WebMonitor } from "../src/index";
import jestMock from "jest-fetch-mock";
import { TrackerEvents } from "../src/types";

jestMock.enableMocks();

const monitor = WebMonitor.init();

describe("API: configData", () => {
  it("check basic type", () => {
    monitor.configData({
      foo: "hello"
    });
    monitor.configData("bar", "world");

    expect(monitor.$data.foo).toBe("hello");
    expect(monitor.$data.bar).toBe("world");
  });

  it("check overwrite", () => {
    monitor.configData({
      foo: "hello"
    });
    monitor.configData({
      foo: "world"
    });

    expect(monitor.$data.foo).toBe("world");
  });

  it("check deep overwrite", () => {
    monitor.configData({
      foo: {
        foo: "hello",
        bar: "world"
      }
    });
    monitor.configData({
      foo: {
        bar: "hello"
      }
    });

    expect(monitor.$data.foo).toEqual({
      foo: "hello",
      bar: "hello"
    });
  });
});

describe("fetchInterceptor", () => {
  it("test reqStart", (done) => {
    const fn = jest.fn();

    monitor.removeAllListeners();
    monitor.on(TrackerEvents.reqStart, () => {
      fn();
      done();
    });

    fetch("https://baidu.com");

    expect(fn).toHaveBeenCalled();
  });
});

describe("ajaxInterceptor", () => {
  it("test reqStart", (done) => {
    const fn = jest.fn();

    monitor.removeAllListeners();
    monitor.on(TrackerEvents.reqStart, () => {
      fn();
      done();
    });

    const xhr = new XMLHttpRequest();
    xhr.open("get", "https://baidu.com");
    xhr.send();

    expect(fn).toHaveBeenCalled();
  });
});
