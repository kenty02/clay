import {trpc} from '../utils/trpc'
import {useMemo, useRef} from 'react'
import {useListState, useViewportSize} from '@mantine/hooks'
import {ForceGraph2D} from 'react-force-graph'

function NodeGraphView(): JSX.Element {
  const {
    node: {
      get: {invalidate}
    }, client
  } = trpc.useContext()
  const {mutate: selectFocus} = trpc.focus.select.useMutation()

  // idだけ使う
  const {data: initialNodeIds} = trpc.node.getAllFocusedAndItsRelatives.useQuery(undefined, {
    // 一回しか取得する必要ないため
    staleTime: Infinity,
  })
  const [nodeIds, updateNodeIds] = useListState<number>(initialNodeIds)

  const nodesQueryResults = trpc.useQueries((t) =>
    nodeIds.map((id) => t.node.get({nodeId: id!}, {
      // subscribeするため
      staleTime: Infinity,
      keepPreviousData: true,
      suspense: false /*important*/
    }))
  )
  trpc.node.onUpdate.useSubscription(undefined, {
    onData: (data) => {
      const {id} = data
      void invalidate({nodeId: id})
      if (!nodeIds.includes(id)) {
        updateNodeIds.append(id);
        // zoom to new node after some ms
        setTimeout(() => {
          const nodes = graphDataRef.current.nodes.filter(n => n.id === id)
          const node = nodes.length > 0 ? nodes[0] : null
          if (node == null) return

          fgRef.current!.centerAt(node.x as number, node.y as number)
        }, 500)
      }
    },
    onError: (error) => {
      throw error
    }
  })

  const fgRef = useRef<NonNullable<React.ComponentProps<typeof ForceGraph2D>["ref"]>["current"]>()

  const graphData = useMemo(() => {
    const nodes = nodesQueryResults.filter(r => r.data != null).map((r) => ({
      ...r.data,
      urlHostname: new URL(r.data?.url ?? "http://example.com").hostname
    }))
    const links = nodes.filter((n) => n.parentId != null && nodeIds.includes(n.parentId)).map((n) => {
      return {source: n.parentId, target: n.id}
    })

    return {nodes, links}
  }, [nodesQueryResults.map(r => r.data)])

  const graphDataRef = useRef(graphData)
  graphDataRef.current = graphData

  const {height, width} = useViewportSize()
  return (
    <div>
      <ForceGraph2D
        width={width}
        height={height * 0.8}
        ref={fgRef}
        // graphData={{nodes: [{id:1,title:"hoge"}], links: []}}
        graphData={graphData}
        dagMode={"td"}
        dagLevelDistance={30}
        backgroundColor="#101020"
        linkColor={() => 'rgba(255,255,255,0.2)'}
        // nodeRelSize={1}
        // nodeId="id"
        // nodeVal={node => 100 / (node.level + 1)}
        nodeLabel="title"
        nodeAutoColorBy="urlHostname"
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        d3VelocityDecay={0.3}
        onNodeClick={(node) => {
          client.focus.get.query({nodeId: node.id as number}).then((focuses
          ) => {
            if (focuses.length > 0)
              selectFocus(focuses[0].id)
          })
        }}
      />
    </div>
  )
}

export default NodeGraphView
