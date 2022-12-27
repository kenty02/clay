import browser from "webextension-polyfill";

const logServerSock = new WebSocket("ws://localhost:5001");

export const log = (message: Parameters<JSON["stringify"]>[0]) => {
  console.log(message);
  const messageString =
    typeof message === "string" ? message : JSON.stringify(message, null, 2);
  if (logServerSock.readyState === WebSocket.OPEN)
    logServerSock.send(messageString);
  else {
    logServerSock.onopen = () => logServerSock.send(messageString);
  }
};

const logJsonServerSock = new WebSocket("ws://localhost:5002");
// json形式のログを出力する（保存される)。
export const logJson = (message: string) => {
  if (logJsonServerSock.readyState === WebSocket.OPEN)
    logJsonServerSock.send(message);
  else {
    logJsonServerSock.onopen = () => logJsonServerSock.send(message);
  }
};

export const checkFullArray = <T>(array: (T | undefined)[]): array is T[] => {
  return array.indexOf(undefined) === -1;
};

interface HasId<U> {
  id: U;
}
export function ensureId<T extends { id?: U }, U = number>(
  data: T
): asserts data is T & HasId<U> {
  if (!data.id) throw new IdSomehowNotFoundError();
}

// Dexieで取得したデータに何故かidがない場合
export class IdSomehowNotFoundError extends Error {
  constructor() {
    super(`id somehow not found`);
  }
}

export function searchHistoryByUrl(url: string) {
  return browser.history.search({ text: url });
}
