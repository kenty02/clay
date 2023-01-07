import { Table } from '@mantine/core'
import { trpc } from '../utils/trpc'
import { useState } from 'react'
import { useImmer } from 'use-immer'

type NodeView = {
  id: number
  title: string
}

function NodeTableView(): JSX.Element {
  const [errors, setErrors] = useState<[number, unknown][]>([])
  const [data, updateData] = useImmer<NodeView[]>([])
  trpc.node.onUpdate.useSubscription(undefined, {
    onData: (data) => {
      updateData((draft) => {
        for (let i = 0; i < draft.length; i++) {
          if (draft[i].id === data.id) {
            draft[i] = data
            return
          }
        }
        draft.push(data)
      })
    },
    onError: (error) => {
      console.error(error)
      setErrors((errors) => [...errors, [Date.now(), error]])
    }
  })

  const rows = data.map((row) => (
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
