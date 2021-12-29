# Description

A SDK for web error and performance monitor using event subscription

# Screenshot
![screenshot](https://cdn.jsdelivr.net/gh/sandy1504/media@master/20210407/screenshot.6l0t3bpqubw0.gif)

# Example

Online example: http://monitor.huzerui.com

Open chrome developer tool to see console information

# Feature

- [x] Error observe, includes js error, unhandle rejection error, http error and resource error
- [x] Error sampling, support errors collection emit events for report optimization
- [x] Observe page performance
- [x] Observe user behaviors, includes console, user click event
- [x] Integrate rrweb
- [x] Hack spa router change
- [x] Auto report

# Development

```
npm run watch  // Watch tsfile change and compile by rollup
npm run server // Start a nodejs test server
```

Then visit `localhost:3000` for example test

# Build

```
npm run build
```

# Test

```
npm run test
```

# Installation

## CDN

```html
<script src="https://cdn.jsdelivr.net/npm/femonitor-web@1.2.0/dist/index.min.js"></script>
```

## NPM

```
npm i femonitor-web -S
```

# Usage

## Minimal options

```js
import { Monitor } from "femonitor-web";
const monitor = Monitor.init();
/* Listen single event */
monitor.on([event], (emitData) => {
  // Do report
  // ...
});
/* Or listen some events by pass Array, eg: only listen error events */
monitor.on(["jsError", "unhandleRejection", "resourceError", "vuejsError", "reqError"], (eventName, emitData) => {
  // Do report
  // ...
});
/* Or Listen all events, not recommend */
monitor.on("event", (eventName, emitData) => {
  // Do report
  // ...
});
```

## Full options

```typescript
// Default full options
export const defaultTrackerOptions = {
  env: "dev",
  reportUrl: "",
  data: {},
  error: {
    watch: true, // If listen all error
    random: 1, // Sampling rate from 0 to 1, 1 means emit all error
    repeat: 5, // 5 means don't emit sample error events when exceed 5 times. Be careful to set large number because if your report handler cause error, it would probably cause js dead cycle
    delay: 1000 // Delay emit event after 1000 ms
  },
  performance: false, // If want to collect performance data
  http: {
    fetch: true, // If listen request use fetch interface
    ajax: true // If listen ajax request
  },
  behavior: {
    watch: false,
    console: [ConsoleType.error],
    click: true, // If set to true will listen all dom click event
    queueLimit: 20 // Limit behavior queue to 20
  },
  /**
   * rrweb use mutation observer api, for compatibility see:
   * https://caniuse.com/mutationobserver
   */
  rrweb: {
    watch: false,
    queueLimit: 50, // Limit rrweb queue to 20
    delay: 1000 // Emit event after 1000 ms
  },
  isSpa: true // If watch is true, globalData can get _spaUrl for report when route change
};
const monitor = Monitor.init(defaultTrackerOptions);
```

## Vue project

Sdk support `Vue.config.errorHandler` to handle error for get detail component info. You just need to call `useVueErrorListener` before create Vue instance.

```
monitor.useVueErrorListener(Vue)
```

## React project

React supply a hook called `componentDidCatch` for error listen and concept called ErrorBoundary which is enabled to catch errors at top and prevent app to shutdown. You can report it by yourself like below.

```js
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    this.setState({ hasError: true });
    reportError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

# Support events

| EventName            | Description                                                             |
| -------------------- | ----------------------------------------------------------------------- |
| jsError              | winodw.onerror                                                          |
| vuejsError           | Vue.config.errorHandler                                                 |
| unhandleRejection    | window.onunhandledrejection                                             |
| resourceError        | Resource request error                                                  |
| reqError             | Network request error                                                   |
| batchErrors          | Batch collection of error events, includes 'jsError', 'vuejsError', 'unHandleRejection', 'resourceError' and 'reqError' , trigger every specified time interval |
| reqStart             | Network request start                                                   |
| reqEnd               | Network request end                                                     |
| performanceInfoReady | Performance data is ready                                               |
| event                | Includes all events above                                               |
