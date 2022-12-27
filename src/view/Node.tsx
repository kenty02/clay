import React from "react";
import { IFocus } from "src/db";
import { sendMessage } from "webext-bridge";

type Props = {
  title: string;
  url: string;
  iconUrl: string;
  focus?: IFocus;
};

export const Node: React.VFC<Props> = ({ title, url, iconUrl, focus }) => {
  // a button to open example.com
  const truncatedUrl = url.length > 30 ? `${url.slice(0, 30)}...` : url;
  const onClick = async () => {
    if (focus)
      await sendMessage("selectFocus", { focusId: focus.id }, "background");
  };

  return (
    <>
      {/* TODO: fix z-10 or zIndex not working... */}
      <div
        style={{ zIndex: 10 }}
        className="p-6 max-w-sm mx-auto rounded-xl flex items-center space-x-4 shadow-lg border-4 border-bg bg-white "
      >
        <div className="shrink-0">
          <img
            className={`h-12 w-12 bg-white rounded-full ${
              focus && "ring-4 ring-offset-2 ring-green-400"
            } ${focus && !focus.active ? "outline-dashed" : ""}`}
            src={iconUrl}
            alt={title}
          />
        </div>
        <div>
          <a
            href="#"
            onClick={onClick}
            className="text-sm font-medium text-black"
          >
            {title}
          </a>
          <br />
          <a href={url} className="text-slate-500">
            {truncatedUrl}
          </a>
        </div>
      </div>
    </>
  );
};
