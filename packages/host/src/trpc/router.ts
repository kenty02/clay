import {initTRPC} from '@trpc/server'
import {observable} from '@trpc/server/observable'
import {z} from 'zod'
import browser from 'webextension-polyfill'
import {FocusUpdate, NodeUpdate} from './types'
import {Observable, Subject} from 'rxjs'
import {db, INode} from '../db'
import superjson from 'superjson'
import {searchHistoryByUrl} from '../utils'

const t = initTRPC.create({ isServer: false, allowOutsideOfServer: true, transformer: superjson })

export type AppRouter = typeof appRouter
export const appRouter = t.router({
  debug: t.router({
    onLog: t.procedure.subscription(() => {
      return convertObservable(debugLogSubject)
    })
  }),
  hello: t.procedure.input(z.string()).query((req) => {
    return `hello ${req.input}`
  }),
  node: t.router({
    onUpdate: t.procedure.subscription(() => {
      return convertObservable(nodeUpdateSubject)
    }),
    get: t.procedure.input(z.object({nodeId: z.number()})).query(async ({input}) => {
      const {nodeId} = input
      const nodes = await db.node.filter((node) => node.id === nodeId).toArray()
      const nodeTitles: Record<number, string> = {}
      await Promise.all(
        nodes.map(async (node) => {
          const historyItem = await searchHistoryByUrl(node.url)
          const hasTitleItems = historyItem.filter((n) => n.url === node.url)
          let title: string
          // とりあえず最初の要素
          if (hasTitleItems.length === 0 || hasTitleItems[0].title == null) {
            title = node.url
          } else {
            title = hasTitleItems[0].title
          }
          nodeTitles[node.id!] = title
        })
      )
      if (nodes.length === 0) {
        throw new Error('node not found')
      }
      return { ...nodes[0], title: nodeTitles[nodes[0].id!] }
      // actually we only need one
      /*
      return nodes.map((node) => ({
        ...node,
        title: nodeTitles[node.id!]
      })) satisfies (INodeWithoutPosition & { title: string })[]
*/
    }),
    getAllFocusedAndItsRelatives: t.procedure.query(async () => {
      // assuming all focus.active is true
      const activeFocus = await db.focus.filter((focus) => focus.active).toArray()
      const activeFocusNodeIds = activeFocus.map((focus) => focus.nodeId)
      const activeFocusNodes = await db.node
        .filter((node) => activeFocusNodeIds.includes(node.id!))
        .toArray()

      const res: number[] = []
      const getSelfAndRelatives = async (node: INode) => {
        if (res.findIndex((n) => n === node.id) !== -1) return
        res.push(node.id!)
        const children = await db.node.where('parentId').equals(node.id!).toArray()
        const parents =
          node.parentId != null ? await db.node.where('id').equals(node.parentId).toArray() : []
        await Promise.all([
          ...children.map(getSelfAndRelatives),
          ...parents.map(getSelfAndRelatives)
        ])
      }
      await Promise.all(activeFocusNodes.map(getSelfAndRelatives))
      return res
    })
  }),
  focus: t.router({
    onUpdate: t.procedure.subscription(() => {
      return convertObservable(focusUpdateSubject)
    }),
    get: t.procedure.input(z.object({ nodeId: z.number() })).query(async ({ input }) => {
      const { nodeId } = input
      const collection = db.focus.filter((focus) => focus.nodeId === nodeId)
      if (!collection) {
        throw new Error('focus not found for nodeId ' + nodeId)
      }
      return (await collection.toArray()).map(
        (focus) =>
          <FocusUpdate>{
            id: focus.id!,
            nodeId: focus.nodeId,
            tabId: focus.tabId,
            active: focus.active
          }
      )
    }),
    getAllActive: t.procedure.query(async () => {
      return (await db.focus.filter((f) => f.active).toArray()).map(
        (focus) =>
          <FocusUpdate>{
            id: focus.id!,
            nodeId: focus.nodeId,
            tabId: focus.tabId,
            active: focus.active
          }
      )
    }),
    select: t.procedure.input(z.number()).mutation(async ({input: focusId}) => {
      const focus = await db.focus.get(focusId)
      if (!focus) {
        throw new Error('focus not found')
      }

      // activate browser tab
      await browser.tabs.update(focus.tabId, {active: true})
    })
  })
})

export const debugLogSubject = new Subject<unknown>()
export const nodeUpdateSubject = new Subject<NodeUpdate>()
export const focusUpdateSubject = new Subject<FocusUpdate>()

const convertObservable = <T>(obs: Observable<T>) => {
  return observable<T>((emit) => {
    const subscriber = obs.subscribe({
      next: (data) => {
        emit.next(data)
      },
      error: (err) => {
        emit.error(err)
      },
      complete: () => {
        emit.complete()
      }
    })
    return () => {
      subscriber.unsubscribe()
    }
  })
}
