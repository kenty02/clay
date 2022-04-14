import { Node } from "./Node";
import React, { ComponentProps, useEffect, useRef, useState } from "react";
import browser from "webextension-polyfill";
import { FixedSizeList as List } from "react-window";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "src/db";
import { log } from "../utils";

(async () => {
  const thisTab = await browser.tabs.getCurrent();
  await browser.tabs.update(thisTab.id, { pinned: true });
})();

const useFocusAt = (nodeId: number) => {
  const focus = useLiveQuery(async () => {
    // CAVEAT: can be multiple
    return db.focus.where("nodeId").equals(nodeId).first();
  }, [nodeId]);
  return focus;
};

const useNodeAt = (col: number, row: number) => {
  const node = useLiveQuery(() => {
    return db.node
      .where("[absolutePosition.col+absolutePosition.row]")
      .equals([col, row])
      .first();
  }, [col, row]);
  return node;
};
const useHistories = (url: string) => {
  const [history, setHistory] = useState<browser.History.HistoryItem[]>([]);
  useEffect(() => {
    if (url !== "") browser.history.search({ text: url }).then(setHistory);
  }, [url]);
  return history;
};

const RowInColumn = ({ index, style, col }) => {
  const node = useNodeAt(col, index);
  const focus = useFocusAt(node?.id ?? -1);
  const histories = useHistories(node?.url ?? "");
  const history = histories.length > 0 ? histories[0] : undefined;
  const ref = useRef<any>();
  return (
    <div style={style} className="px-2">
      {/* <Node */}
      {/*   title={"Col " + col + ",Row " + index} */}
      {/*   iconUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/36px-Google_%22G%22_Logo.svg.png?20210618182606" */}
      {/*   url="https://google.com" */}
      {/* /> */}
      {node ? (
        <Node
          title={`${history?.title ?? history?.url ?? ""}${
            node.id
          }:(${col},${index})`}
          iconUrl={"chrome://favicon/" + history?.url}
          url={node.url}
          isFocused={!!focus}
          ref={ref}
        />
      ) : null}
    </div>
  );
};
const RowInColumnAt = (col: number) => {
  return (props: Omit<ComponentProps<typeof RowInColumn>, "col">) =>
    RowInColumn({ col, ...props });
};
const columnWidth = 350;
const Column = ({ index, style }) => (
  <div style={style}>
    <List
      height={1000}
      itemCount={10}
      itemSize={150}
      layout="vertical"
      width={columnWidth}
      // direction="rtl"
      // style={style}
      className="no-scrollbars"
    >
      {RowInColumnAt(index)}
    </List>
  </div>
);
export const DebugPallet: React.VFC = () => {
  const handleResetButton = () => {
    window.indexedDB.deleteDatabase("spile");
    browser.runtime.reload();
  };

  return (
    <div className="flex flex-col">
      <button className="btn-primary" onClick={handleResetButton}>
        Reset DB & Reload
      </button>
    </div>
  );
};

export const Option: React.VFC = () => {
  return (
    <>
      {/* <Node */}
      {/*   title="Page Title" */}
      {/*   iconUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/36px-Google_%22G%22_Logo.svg.png?20210618182606" */}
      {/*   url="https://google.com" */}
      {/* /> */}
      <DebugPallet />
      <List
        height={5000}
        itemCount={1000}
        itemSize={columnWidth}
        layout="horizontal"
        width={3000}
        // direction="rtl"
        className="bg-gray-300"
      >
        {Column}
      </List>
    </>
  );
};
