import MobileDetect from "mobile-detect";

export interface IDeviceInfo {
  mobile: string | null;
  phone: string | null;
  tablet: string | null;
  userAgent: string;
  isPhone: boolean;
  isRobot: boolean;
  version: number;
  versionStr: string;
  screenW: number;
  screenH: number;
  dpr: number;
}

export function getDeviceInfo(): IDeviceInfo {
  const md = new MobileDetect(window.navigator.userAgent);

  return {
    mobile: md.mobile(),
    phone: md.phone(),
    tablet: md.tablet(),
    userAgent: md.userAgent(),
    isPhone: md.is("iPhone"),
    isRobot: md.is("bot"),
    version: md.version("Webkit"),
    versionStr: md.versionStr("Build"),
    dpr: window.devicePixelRatio,
    screenW: document.documentElement.clientWidth || document.body.clientWidth,
    screenH: document.documentElement.clientHeight || document.body.clientHeight
  };
}
