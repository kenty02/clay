import React from "react";
import browser from "webextension-polyfill";

export const Option: React.VFC = () => {
  const handleClick = () => {
    browser.tabs.create({ url: "https://example.com/" });
  };

  // a button to open example.com
  return (
    <button onClick={handleClick} className="btn btn-primary">
      I am a button!
    </button>
  );
};
