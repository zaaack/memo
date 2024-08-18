import { CheckList, Dialog } from "antd-mobile";
import { useCallback, useEffect, useRef } from "react";
import type { BufferLike } from "webdav";

export function toText(html: string) {
  return html.replace(/<[^>]+>/g, "");
}

function base64ToBlob(urlData: string) {
  try {
    var arr = urlData.split(","),
      mime = arr[0].match(/:(.*?);/)?.[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (error) {
    return new Blob([]);
  }
}

let blobMap = new Map<string, string>();

export function imageToBlobURL(key: string, data: string | BufferLike) {
  if (!data) return void 0;
  if (key && blobMap.has(key)) {
    return blobMap.get(key);
  }
  let b = typeof data === "string" ? base64ToBlob(data) : data;
  let u = URL.createObjectURL(new Blob([b])); // + `?id=${key}`;
  if (key) {
    blobMap.set(key, u);
  }
  console.log("blob url", u);
  return u;
}

export function sleep(ms: number) {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
}
