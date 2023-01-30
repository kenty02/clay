import { IFocus, INode } from '../db'

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
export type WithId<T extends { id?: unknown }> = WithRequired<T, 'id'>

export interface NodeUpdate extends WithId<Partial<INode>> {
  title?: string
}

export type FocusUpdate = WithId<Partial<IFocus>>
