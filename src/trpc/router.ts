import { initTRPC } from '@trpc/server'
import { observable } from '@trpc/server/observable'
import { EventEmitter } from 'events' // todo npm remove events
import { z } from 'zod'
import browser from 'webextension-polyfill'
import { FocusUpdate, NodeUpdate } from './types'
import { Observable, Subject } from 'rxjs'
import { db } from '../db'
import superjson from 'superjson'

// create a global event emitter (could be replaced by redis, etc)
const ee = new EventEmitter()

const t = initTRPC.create({ isServer: true, transformer: superjson })

export const appRouter = t.router({
  onAdd: t.procedure.subscription(() => {
    // `resolve()` is triggered for each client when they start subscribing `onAdd`

    // return an `observable` with a callback which is triggered immediately

    return observable<string>((emit) => {
      const onAdd = (data: string) => {
        // emit data to client
        emit.next(data)
      }

      browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        emit.next(changeInfo.url ?? '')
      })
      // trigger `onAdd()` when `add` is triggered in our event emitter
      ee.on('add', onAdd)

      // unsubscribe function when client disconnects or stops subscribing
      return () => {
        ee.off('add', onAdd)
      }
    })
  }),
  add: t.procedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        text: z.string().min(1)
      })
    )
    .mutation(async ({ input }) => {
      const post = { ...input } /* [..] add to db */

      ee.emit('add', post)
      return post
    }),
  hello: t.procedure.input(z.string()).query((req) => {
    return `hello ${req.input}`
  }),
  node: t.router({
    onUpdate: t.procedure.subscription(() => {
      return convertObservable(nodeUpdateSubject)
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
    select: t.procedure.input(z.number()).mutation(async ({ input }) => {
      const focusId = input
      const focus = await db.focus.get(focusId)
      if (!focus) {
        throw new Error('focus not found')
      }

      // activate browser tab
      await browser.tabs.update(focus.tabId, { active: true })
    })
  })
})

export const nodeUpdateSubject = new Subject<NodeUpdate>()
export const focusUpdateSubject = new Subject<FocusUpdate>()

const convertObservable = <T>(obs: Observable<T>) => {
  return observable<T>((emit) => {
    const randomId = Math.random().toString(36).substring(7)
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
