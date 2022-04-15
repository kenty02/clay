import Dexie, { Table } from "dexie";

export interface INodeWithoutPosition {
  id?: number; // auto increment
  url: string;
  parentId?: number;
  childrenIds: number[];
}
export interface INodePosition {
  absolutePosition: {
    col: number;
    row: number;
  };
}
export type INode = INodeWithoutPosition & INodePosition;
// should be ephemeral or permanent ( or both ) ?
export interface IFocus {
  id?: number;
  nodeId: number;
  tabId: number;
}
export interface IComment {
  id?: number;
  nodeId: number;
  content: string;
  createdAt: Date;
}

export class SpileDatabase extends Dexie {
  // We just tell the typing system this is the case
  node!: Table<INode, number>;
  focus!: Table<IFocus, number>;
  comment!: Table<IComment, number>;

  constructor() {
    super("spile");
    this.version(1).stores({
      node: "++id, url, parentId, childrenIds, absolutePosition.col, [absolutePosition.col+absolutePosition.row]", // Primary key and indexed props
      focus: "++id, nodeId, tabId",
      comment: "++id, nodeId, [nodeId+createdAt]",
    });
  }
}

export const db = new SpileDatabase();

db.on("populate", () => {
  // test data
  // db.node.bulkAdd([
  //   {
  //     url: "http://test.com",
  //     childrenIds: [],
  //     absolutePosition: { col: 0, row: 0 },
  //   },
  // ]);
});
