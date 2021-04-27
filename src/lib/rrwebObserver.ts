import { myEmitter } from "./event";
import { TrackerEvents } from "../types";
import * as rrweb from "rrweb";
import { eventWithTime } from "rrweb/typings/types";

export class RrwebObserver {
  init(): void {
    rrweb.record({
      emit(event: eventWithTime) {
        myEmitter.emit(TrackerEvents._mouseTrack, event);
      }
    });
  }
}
