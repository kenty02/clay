// import browser from "webextension-polyfill";
// import webExtBridge from "webext-bridge";

describe("background test", () => {
  beforeAll(async () => {
    // mock getUrl
    mockBrowser.runtime.getURL.mock(() => "https://example.com");
    await import("./index");
  });
  it("should geURL of options.html", () => {
    mockBrowser.runtime.getURL.expect("options.html");
  });
});
