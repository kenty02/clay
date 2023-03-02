import { trpc } from '../../../../utils/trpc'
// ______________________________________________________
//
export type ContainerProps = {}
export type Props = {} & ContainerProps
// ______________________________________________________
//
export const Component = ({}: Props): JSX.Element => {
  const { data } = trpc.node.get.useQuery({ nodeId: 3333 })
  if (!data) return <div>loading...</div>
  trpc.node.onUpdate.useSubscription(undefined, {
    onData: (data) => {
      console.log(data)
    }
  })

  return <div>{JSON.stringify(data)}</div>
}

export const MockTest = (props: ContainerProps): JSX.Element => {
  return <Component {...props} />
}
