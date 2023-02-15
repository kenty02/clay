import Dexie, { Table } from 'dexie'

export interface INode {
  // auto increment
  id?: number
  url: string
  parentId?: number
  childrenIds: number[]
  title: string
}

// should be ephemeral or permanent ( or both ) ?
export interface IFocus {
  id?: number
  nodeId: number
  tabId: number
  active: boolean
}

export interface IComment {
  id?: number
  nodeId: number
  content: string
  createdAt: Date
}

export class ClayDatabase extends Dexie {
  // We just tell the typing system this is the case
  node!: Table<INode, number>
  focus!: Table<IFocus, number>
  comment!: Table<IComment, number>

  constructor() {
    super('clay')
    this.version(1).stores({
      node: '++id, url, parentId, childrenIds', // Primary key and indexed props
      focus: '++id, nodeId, tabId',
      comment: '++id, nodeId, [nodeId+createdAt]'
    })
  }
}

export const db = new ClayDatabase()

db.on('populate', () => {
  // test data
  // db.node.bulkAdd([
  //   {
  //     url: "http://test.com",
  //     childrenIds: [],
  //     absolutePosition: { col: 0, row: 0 },
  //   },
  // ]);
})
