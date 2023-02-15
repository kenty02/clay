import { trpc } from '../utils/trpc'
import React, { useRef } from 'react'
import type { INode } from 'clay-host/src/db'
import { NodeUpdate } from 'clay-host/src/trpc/types'

type Params = {
  onNodeUpdate: (data: NodeUpdate) => void
}
type Return = {
  nodesRef: React.MutableRefObject<INode[]>
}
export default function useNodes({ onNodeUpdate }: Params): Return {
  const { data: initialNodeIds } = trpc.node.getAllFocusedAndItsRelatives.useQuery(undefined, {
    // 一回しか取得する必要ないため
    staleTime: Infinity,
    suspense: true
  })
  if (initialNodeIds === undefined) throw new Error('initialNodeIds is undefined')
  const { data: initialNodes } = trpc.node.bulkGet.useQuery(
    { nodeIds: initialNodeIds },
    {
      // 一回しか取得する必要ないため
      staleTime: Infinity,
      suspense: true
    }
  )
  if (initialNodes === undefined) throw new Error('initialNodes is undefined')

  const nodesRef = useRef<INode[]>(initialNodes)
  trpc.node.onUpdate.useSubscription(undefined, {
    onData: (data) => {
      onNodeUpdate(data)
    },
    onError: (error) => {
      throw error
    }
  })
  return { nodesRef }
}
