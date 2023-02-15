import { IFocus, INode } from '../db'

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
export type WithId<T extends { id?: unknown }> = WithRequired<T, 'id'>

export type NodeUpdate = WithId<Partial<INode>>

export type FocusUpdate = WithId<Partial<IFocus>>
