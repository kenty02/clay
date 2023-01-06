export interface NodeUpdate {
    id: number,
    url: string,
    parentId?: number,
    childrenIds: number[],
    title: string,
}

export interface FocusUpdate {
    id: number,
    nodeId: number,
    tabId: number,
    active: boolean,
}
