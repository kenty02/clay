import { AnyRouter, BuildProcedure, ProcedureParams } from '@trpc/server'
import { Awaitable } from 'electron-trpc/main'
import { observable, Observable } from '@trpc/server/observable'
import { TRPCClientError, TRPCLink } from '@trpc/client'
import { AppRouter } from 'clay-host/src/trpc/router'
import { Observable as RxJSObservable } from 'rxjs'
import { t } from '../../../../node_modules/@trpc/client/dist/transformResult-6fb67924.mjs'
import type { transformResult as TransformResultType } from '@trpc/client/src/links/internals/transformResult'
import { TRPCResponse } from '@trpc/server/rpc'

const transformResult: typeof TransformResultType = t

/* eslint-disable @typescript-eslint/no-explicit-any */
type ExtractKeys<T extends AnyRouter, K extends keyof T = keyof T> = T[K] extends
  | BuildProcedure<'query', any, any>
  | BuildProcedure<'mutation', any, any>
  | BuildProcedure<'subscription', any, any>
  | AnyRouter
  ? K
  : never
type ExtractInput<T extends ProcedureParams> = T extends ProcedureParams<any, any, any, infer P>
  ? P
  : ["Can't extract input", T]
type WithInput<T extends AnyRouter, K extends keyof T = keyof T> = T[K] extends BuildProcedure<
  any,
  infer P,
  any
>
  ? ExtractInput<P>
  : never
type WithOutput<T extends AnyRouter, K extends keyof T = keyof T> = T[K] extends BuildProcedure<
  any,
  any,
  infer P
>
  ? P
  : never
type ContextWithDataTransformer<T extends AnyRouter, K extends keyof T = keyof T> = {
  data: (data: T[K] extends BuildProcedure<any, any, infer P> ? P : never) => any
}
type ConvertObservable<T> = T extends Observable<infer U, any> ? RxJSObservable<U> : T
type SetQueryHandler<T extends AnyRouter, K extends keyof T> = (
  handler: (
    input: WithInput<T, K>,
    context: ContextWithDataTransformer<T, K>
  ) => Awaitable<WithOutput<T, K>>
) => void
type SetMutationHandler<T extends AnyRouter, K extends keyof T> = (
  handler: (
    input: WithInput<T, K>,
    context: ContextWithDataTransformer<T, K>
  ) => Awaitable<WithOutput<T, K>>
) => void
type SetSubscriptionHandler<T extends AnyRouter, K extends keyof T> = (
  handler: (
    input: WithInput<T, K>,
    context: ContextWithDataTransformer<T, K>
  ) => ConvertObservable<WithOutput<T, K>>
) => void
type Query<T extends AnyRouter, K extends keyof T> = {
  query: SetQueryHandler<T, K>
}
type Mutation<T extends AnyRouter, K extends keyof T> = {
  mutation: SetMutationHandler<T, K>
}
type Subscription<T extends AnyRouter, K extends keyof T> = {
  subscription: SetSubscriptionHandler<T, K>
}
type ExtractProcedureHandler<T extends AnyRouter, K extends keyof T> = T[K] extends BuildProcedure<
  'mutation',
  any,
  any
>
  ? Mutation<T, K>
  : T[K] extends BuildProcedure<'query', any, any>
  ? Query<T, K>
  : T[K] extends BuildProcedure<'subscription', any, any>
  ? Subscription<T, K>
  : T[K] extends AnyRouter
  ? Mock<T[K]>
  : never
type Mock<T extends AnyRouter> = {
  [key in keyof T as ExtractKeys<T, key>]: ExtractProcedureHandler<T, key>
}
type RegistryMap = Map<
  string,
  { type: 'query' | 'mutation' | 'subscription'; handler: (input, context) => Awaitable<any> }
>
const createMock = <TRouter extends AnyRouter>(): {
  mock: Mock<TRouter>
  registry: RegistryMap
} => {
  const registry: RegistryMap = new Map()
  // eslint-disable-next-line @typescript-eslint/ban-types
  const handler1: ProxyHandler<{}> & {
    path: string[]
  } = {
    path: [],
    get(_target: unknown, prop: string) {
      if (prop === 'query') {
        return (handler) => {
          registry.set(this.path.join('.'), { type: 'query', handler })
          this.path = []
        }
      }

      if (prop === 'mutation') {
        return (handler) => {
          registry.set(this.path.join('.'), { type: 'mutation', handler })
          this.path = []
        }
      }

      if (prop === 'subscription') {
        return (handler) => {
          registry.set(this.path.join('.'), { type: 'subscription', handler })
          this.path = []
        }
      }

      this.path.push(prop)

      return new Proxy({}, handler1)
    }
  }
  return { mock: new Proxy({}, handler1) as Mock<TRouter>, registry }
}

export function mockLink<TRouter extends AnyRouter>(
  mocker: (mock: Mock<TRouter>) => void
): TRPCLink<AppRouter> {
  return (runtime) => {
    return ({ op }) => {
      return observable((observer) => {
        const { type, path, context } = op

        const { mock, registry } = createMock()
        // @ts-ignore とりあえず動く
        mocker(mock)

        const input = runtime.transformer.serialize(op.input).json
        let isCancelled = false
        const unsubscribes = new Set<() => void>()
        ;(async (): Promise<void> => {
          if (type === 'query') {
            const regist = registry.get(path)
            if (!regist) {
              throw new Error(`No handler found for query "${path}"`)
            }
            const { handler, type } = regist
            if (type !== 'query') {
              throw new Error(`Invalid handler type: "${path}"`)
            }

            const result = await handler(input, context)

            const message = runtime.transformer.serialize(result)
            const trpcResult: TRPCResponse = {
              result: { data: message }
            }
            const transformed = transformResult(trpcResult, runtime)
            if (!transformed.ok) {
              throw new Error('transform failed')
            }

            if (!isCancelled) {
              observer.next(transformed)
            }
            observer.complete()
          } else if (type === 'mutation') {
            const regist = registry.get(path)
            if (!regist) {
              throw new Error(`No handler found for mutation "${path}"`)
            }
            const { handler, type } = regist
            if (type !== 'mutation') {
              throw new Error(`Invalid handler type: "${path}"`)
            }

            const result = await handler(input, context)

            const message = runtime.transformer.serialize(result)
            const trpcResult: TRPCResponse = {
              result: { data: message }
            }
            const transformed = transformResult(trpcResult, runtime)

            if (!transformed.ok) {
              throw new Error('transform failed')
            }
            if (!isCancelled) {
              observer.next(transformed)
            }
            observer.complete()
          } else if (type === 'subscription') {
            const regist = registry.get(path)
            if (!regist) {
              throw new Error(`No handler found for subscription "${path}"`)
            }
            const { handler, type } = regist
            if (type !== 'subscription') {
              throw new Error(`Invalid handler type: "${path}"`)
            }

            const resultObservable: RxJSObservable<any> = await handler(input, context)
            let isDone = false
            const subscription = resultObservable.subscribe({
              error(err) {
                isDone = true
                // @ts-ignore investigate later
                observer.error(err)
              },
              complete() {
                if (!isDone) {
                  isDone = true
                  observer.error(TRPCClientError.from(new Error('Operation ended prematurely')))
                } else {
                  observer.complete()
                }
              },
              next(result) {
                const message = runtime.transformer.serialize(result)
                const trpcResult: TRPCResponse = {
                  result: { data: message }
                }
                const transformed = transformResult(trpcResult, runtime)
                if (!transformed.ok) {
                  throw new Error('transform failed')
                }

                observer.next(transformed)
              }
            })
            const unsub = (): void => {
              subscription.unsubscribe()
            }
            unsubscribes.add(unsub)
          } else {
            throw new Error(`No handler found for subscription "${path}"`)
          }
        })()

        return () => {
          isCancelled = true
          unsubscribes.forEach((unsub) => unsub())
        }
      })
    }
  }
}
