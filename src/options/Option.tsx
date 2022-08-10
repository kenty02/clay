import { Node } from "./Node";
import React, { useEffect, useRef, useState } from "react";
import browser from "webextension-polyfill";
import { FixedSizeGrid as Grid, GridChildComponentProps } from "react-window";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "src/db";
import { ensureId } from "../utils";
import { ArcherContainer, ArcherElement } from "react-archer";

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

const Cell: React.VFC<GridChildComponentProps> = ({
  columnIndex,
  rowIndex,
  style,
}) => {
  const node = useNodeAt(columnIndex, rowIndex);
  const focus = useFocusAt(node?.id ?? -1);
  const histories = useHistories(node?.url ?? "");
  const history = histories.length > 0 ? histories[0] : undefined;
  node && ensureId(node);

  return (
    <div style={style} className="px-2">
      {/* <Node */}
      {/*   title={"Col " + col + ",Row " + index} */}
      {/*   iconUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/36px-Google_%22G%22_Logo.svg.png?20210618182606" */}
      {/*   url="https://google.com" */}
      {/* /> */}
      {node ? (
        <>
          <ArcherElement
            id={`ae-node-${node.id}-top`}
            relations={
              node.parentId
                ? [
                    {
                      targetId: `ae-node-${node.parentId}-bottom`,
                      targetAnchor: "top",
                      sourceAnchor: "bottom",
                      // label: `node ${node.id} to parent ${node.parentId ?? -1}`,
                      style: {
                        strokeColor: "blue",
                        strokeWidth: 2,
                        startMarker: false,
                        endMarker: false,
                      },
                    },
                  ]
                : []
            }
          >
            <div>{/* top */}</div>
          </ArcherElement>
          {/* prevent strange ref warning */}
          <Node
            title={`${history?.title ?? history?.url ?? ""}`}
            iconUrl={"chrome://favicon/" + history?.url}
            url={node.url}
            focus={focus ?? null}
          />

          <ArcherElement id={`ae-node-${node.id}-bottom`}>
            <div>{/* bottom */}</div>
          </ArcherElement>
        </>
      ) : null}
    </div>
  );
};
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
  const ref = useRef<ArcherContainer>(null);
  const refresh = () => {
    ref.current?.refreshScreen();
  };
  // just rerender for ref set
  const [, setState] = useState<number>(0);
  useEffect(() => {
    setState(1);
  });
  return (
    <>
      {/* <Node */}
      {/*   title="Page Title" */}
      {/*   iconUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/36px-Google_%22G%22_Logo.svg.png?20210618182606" */}
      {/*   url="https://google.com" */}
      {/* /> */}
      <DebugPallet />
      {/* <List */}
      {/*   height={5000} */}
      {/*   itemCount={1000} */}
      {/*   itemSize={columnWidth} */}
      {/*   layout="horizontal" */}
      {/*   width={3000} */}
      {/*   // direction="rtl" */}
      {/*   className="bg-gray-300" */}
      {/* > */}
      {/*   {Column} */}
      {/* </List> */}
      <ArcherContainer ref={ref} style={{ zIndex: 0, pointerEvents: "none" }}>
        <Grid
          columnCount={1000}
          columnWidth={350}
          rowCount={1000}
          rowHeight={150}
          height={5000}
          width={3000}
          // direction="rtl"
          className="bg-gray-300"
          // onScroll={refresh}
          style={{ zIndex: -10, pointerEvents: "auto" }}
          onScroll={refresh}
        >
          {Cell}
        </Grid>
      </ArcherContainer>
    </>
  );
};
