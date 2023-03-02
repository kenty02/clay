import { trpc } from '../../../../utils/trpc'
import { useCallback, useRef, useState } from 'react'
import { useViewportSize } from '@mantine/hooks'
import { ForceGraph2D } from 'react-force-graph'
import { NodeUpdate } from 'clay-host/src/trpc/types'
import useNodes from '../../../../hooks/use-nodes'
import produce, { setAutoFreeze } from 'immer'
import { useAction } from '../../../../providers/SpotlightProvider'

type Props = {
  width?: number
  height?: number
}

export const NodeGraphView = ({ width, height }: Props): JSX.Element => {
  const { client } = trpc.useContext()

  const zoomTimeout = useRef<number | null>(null)
  const onNodeUpdate = useCallback((data: NodeUpdate) => {
    const { id, parentId } = data
    setGraphData((old) => {
      // let hoge = null
      const nodeIndex = old.nodes.findIndex((n) => n.id === id)
      const isNewNode = nodeIndex === -1
      const newGraphData = produce(old, (draft) => {
        setAutoFreeze(false)
        if (isNewNode && parentId != null) {
          draft.links.push({ source: parentId, target: id })
        }
        if (isNewNode) {
          draft.nodes.push({
            ...(data as Required<typeof data>),
            urlHostname: new URL(data.url ?? 'aa').hostname
          })
        }
      })

      // なぜかimmerを使ってgraphに既にあるnodeを更新すると表示がバグるので、この場合だけは使わずに更新する
      if (!isNewNode) {
        Object.assign(newGraphData.nodes[nodeIndex], {
          ...(data as Required<typeof data>),
          urlHostname: new URL(data.url ?? 'aa').hostname
        })
      }
      console.log({ old, data, new: newGraphData })
      return newGraphData
    })

    // too early?
    // zoom to the updated node after some ms
    if (zoomTimeout.current != null) clearTimeout(zoomTimeout.current)
    zoomTimeout.current = window.setTimeout(() => {
      const nodes = graphDataRef.current.nodes.filter((n) => n.id === id)
      const node = nodes.length > 0 ? nodes[0] : null
      if (node == null) return

      // @ts-ignore ForceGraphが渡したオブジェクトに代入する
      fgRef.current!.centerAt(node.x as number, node.y as number)
    }, 500)
  }, [])

  const { nodesRef } = useNodes({
    onNodeUpdate
  })
  const { mutate: selectFocus } = trpc.focus.select.useMutation()

  const fgRef = useRef<NonNullable<React.ComponentProps<typeof ForceGraph2D>['ref']>['current']>()

  const getInitialGraphData = useCallback(() => {
    // if there is a loading query, return empty for now todo
    // if (nodesQueryResults.some((r) => r.isLoading)) return { nodes: [], links: [] }
    const nodes = nodesRef.current.map((n) => {
      let urlHostname = ''
      if (n.url.length > 0)
        try {
          urlHostname = new URL(n.url).hostname
        } catch (e) {
          console.error(e)
        }
      return {
        ...n,
        urlHostname
      }
    })
    const links = nodes
      .filter((n) => n.parentId != null && nodesRef.current.some((n2) => n2.id === n.parentId))
      .map((n) => {
        return { source: n.parentId, target: n.id }
      })

    return { nodes, links }
  }, [])
  const resetGraphData = useCallback(() => {
    const after = getInitialGraphData()
    console.log({ message: 'resetGraphData', before: graphDataRef.current, after })
    setGraphData(after)
  }, [])
  useAction('resetGraphData', resetGraphData)

  const [graphData, setGraphData] = useState(() => getInitialGraphData())
  const graphDataRef = useRef(graphData)
  graphDataRef.current = graphData

  const { height: vpHeight, width: vpWidth } = useViewportSize()
  return (
    <div>
      <ForceGraph2D
        width={width ?? vpWidth}
        height={height ?? vpHeight}
        ref={fgRef}
        // graphData={{nodes: [{id:1,title:"hoge"}], links: []}}
        graphData={graphData}
        dagMode={'td'}
        dagLevelDistance={30}
        backgroundColor="#F2F2F2"
        nodeCanvasObjectMode={(): 'after' => 'after'}
        nodeCanvasObject={(node, ctx, globalScale): void => {
          ctx.fillStyle = 'rgba(0,0,0,0.7)'
          ctx.font = `${12 / globalScale}px Sans-Serif`
          // @ts-ignore fix later
          ctx.fillText(node.title, (node.x as number) + 10, node.y as number)
        }}
        // linkColor={(): string => 'rgba(255,255,255,0.2)'}
        // nodeRelSize={1}
        // nodeId="id"
        // nodeVal={node => 100 / (node.level + 1)}
        nodeLabel="title"
        nodeAutoColorBy="urlHostname"
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        d3VelocityDecay={0.3}
        onNodeClick={(node): void => {
          client.focus.get.query({ nodeId: node.id as number }).then((focuses) => {
            if (focuses.length > 0) selectFocus(focuses[0].id)
          })
        }}
      />
    </div>
  )
}
