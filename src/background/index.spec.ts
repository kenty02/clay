// import browser from "webextension-polyfill";
import * as webExtBridge from "webext-bridge";

describe.skip("background test", () => {
  beforeAll(async () => {
    // mock getUrl
    mockBrowser.runtime.getURL.mock(() => "https://example.com");
    jest
      .spyOn(webExtBridge, "onMessage")
      .mockImplementationOnce((_mId, callback) => {
        callback({
          // @ts-expect-error type not exported
          sender: null,
          id: "",
          timestamp: new Date().getTime(),
          data: "world",
        });
      });

    await import("./index");
  });
  it("can get URL of View", () => {
    mockBrowser.runtime.getURL.expect("view.html");
  });
});
