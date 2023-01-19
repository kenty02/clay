import { Table } from '@mantine/core'
import { trpc } from '../utils/trpc'
import { useEffect, useState } from 'react'
import { useListState } from '@mantine/hooks'

function NodeTableView(): JSX.Element {
  const [errors, setErrors] = useState<[number, unknown][]>([])
  // idだけ使う
  trpc.node
  const { data: initialData } = trpc.node.getAllFocusedAndItsRelatives.useQuery(undefined, {
    // 一回しか取得する必要ないため
    staleTime: Infinity
  })
  const {
    node: {
      get: { invalidate }
    }
  } = trpc.useContext()
  const [nodeIds, updateNodeIds] = useListState<number>([])
  useEffect(() => {
    if (initialData != null) updateNodeIds.setState(() => initialData.map((node) => node.id!))
  }, [initialData])
  const nodesQueryResults = trpc.useQueries((t) =>
    nodeIds.map((id) => t.node.get({ nodeId: id! }, { staleTime: Infinity }))
  )
  trpc.node.onUpdate.useSubscription(undefined, {
    onData: (data) => {
      const { id } = data
      void invalidate({ nodeId: id })
      if (!nodeIds.includes(id)) updateNodeIds.append(id)
    },
    onError: (error) => {
      console.error(error)
      setErrors((errors) => [...errors, [Date.now(), error]])
    }
  })

  // todo loadingでないものが含まれるので、その取り扱いを考える でもそもそもsuspense=trueなのでそうなるのが謎
  const rows = nodesQueryResults
    .map((r) => r.data)
    .filter((n): n is Exclude<typeof n, undefined> => n != null)
    .map((row) => (
      <tr key={row.id}>
        <td>{row.id}</td>
        <td>{row.title}</td>
      </tr>
    ))
  return (
    <div>
      {errors.map(([id, error]) => (
        // @ts-ignore jjj
        <div key={id}>{error.toString()}</div>
      ))}
      <Table>
        <thead>
          <tr>
            <th>id</th>
            <th>title</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </div>
  )
}

export default NodeTableView
