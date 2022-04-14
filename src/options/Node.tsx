import React from "react";

type Props = {
  title: string;
  url: string;
  iconUrl: string;
  isFocused?: boolean;
};

export const Node: React.VFC<Props> = ({ title, url, iconUrl, isFocused }) => {
  // a button to open example.com
  return (
    <>
      <div className="p-6 max-w-sm mx-auto rounded-xl flex items-center space-x-4 shadow-lg border-4 border-bg bg-white ">
        <div className="shrink-0">
          <img
            className={`h-12 w-12 bg-white rounded-full ${
              isFocused && "ring-4 ring-offset-2 ring-green-400"
            }`}
            src={iconUrl}
            alt={title}
          />
        </div>
        <div>
          <a href={url} className="text-sm font-medium text-black">
            {title}
          </a>
          <br />
          <a href={url} className="text-slate-500">
            {url}
          </a>
        </div>
      </div>
    </>
  );
};
