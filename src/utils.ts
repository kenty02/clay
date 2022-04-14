const logServerSock = new WebSocket("ws://localhost:5001");

export const log = (message: any) => {
  console.log(message);
  if (typeof message !== "string") message = JSON.stringify(message, null, 2);
  if (logServerSock.readyState === WebSocket.OPEN) logServerSock.send(message);
  else {
    logServerSock.onopen = () => logServerSock.send(message);
  }
};

export const checkFullArray = <T>(array: (T | undefined)[]): array is T[] => {
  return array.indexOf(undefined) === -1;
};
