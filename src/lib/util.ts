export function isObject(input: any): boolean {
  return Object.prototype.toString.call(input) === "[object Object]";
}

export function getPageUrl(): string {
  return window.location.href;
}

export function getNetworkType(): string {
  return (navigator as any).connection
    ? (navigator as any).connection.effectiveType
    : "";
}

export function randomString(len?: number) {
  len = len || 10;
  const $chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz123456789";
  const maxPos = $chars.length;
  let pwd = "";
  for (let i = 0; i < len; i++) {
    pwd = pwd + $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return pwd + new Date().getTime();
}

export function getUvLabel() {
  const date = new Date();
  let uvLabel = localStorage.getItem("weaklight_uv") || "";
  const datatime = localStorage.getItem("weaklight_uv_time") || "";
  const today =
    date.getFullYear() +
    "/" +
    (date.getMonth() + 1) +
    "/" +
    date.getDate() +
    " 23:59:59";

  if ((!uvLabel && !datatime) || date.getTime() > Number(datatime)) {
    uvLabel = randomString();
    localStorage.setItem("weaklight_uv", uvLabel);
    localStorage.setItem(
      "weaklight_uv_time",
      String(new Date(today).getTime())
    );
  }
  return uvLabel;
}

export function getUserSessionLabel() {
  let userLabel = sessionStorage.getItem("weaklight_user") || "";
  const result = {
    label: userLabel,
    isFristIn: false
  };

  if (!userLabel) {
    userLabel = randomString();
    sessionStorage.setItem("weaklight_user", userLabel);
    result.label = userLabel;
    result.isFristIn = true;
  }

  return result;
}

export function getLocaleLanguage() {
  if (navigator.languages != undefined) return navigator.languages[0];
  return navigator.language;
}

export function replaceSlash(url: string) {
  return url.replace(/^\/|\/$/g, "");
}

export function convertObjToUrlencoded(obj: {
  [key: string]: any;
}): string {
  return new URLSearchParams(Object.entries(obj)).toString();
}
