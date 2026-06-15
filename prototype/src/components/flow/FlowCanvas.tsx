import { useEffect, useMemo } from 'react'
import {
  ReactFlow, Background, BackgroundVariant, Controls,
  Handle, Position, MarkerType, useNodesState, useEdgesState,
  BaseEdge, EdgeLabelRenderer, getBezierPath,
  type Node, type Edge, type NodeProps, type EdgeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Play, MessageSquare, Bot, Wrench, PhoneForwarded, PhoneOff } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useContent } from '../../content/store'
import { layoutFlow, type AgentFlow, type FlowNodeKind } from '../../lib/agentFlow'

/* ── Flow canvas — an observability view of the Line agent ─────────
   Cartesia-styled react-flow surface. Every card names the Line
   primitive it visualizes (system prompt / agent_as_handoff /
   transfer_call / end_call) in mono — the diagram never pretends
   there's a node runtime. During a preview call the tracer lights
   the node the conversation is on (active) and the path so far
   (visited). Color stays on warm neutrals; brand green marks the
   call's entry/exit and the live trace. */

const KIND_META: Record<FlowNodeKind, {
  labelKey: string
  /** The Line primitive this node visualizes — rendered verbatim, never localized. */
  primitive: string
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string }>
}> = {
  start: { labelKey: 'flow.kind.start', primitive: 'introduction', icon: Play },
  conversation: { labelKey: 'flow.kind.conversation', primitive: 'system prompt', icon: MessageSquare },
  subagent: { labelKey: 'flow.kind.subagent', primitive: 'agent_as_handoff', icon: Bot },
  tool: { labelKey: 'flow.kind.tool', primitive: 'loopback_tool', icon: Wrench },
  transfer: { labelKey: 'flow.kind.transfer', primitive: 'transfer_call', icon: PhoneForwarded },
  end: { labelKey: 'flow.kind.end', primitive: 'end_call', icon: PhoneOff },
}

type TraceState = 'active' | 'visited' | undefined
type AgentNodeData = { kind: FlowNodeKind; title: string; instruction?: string; tool?: string; traceState?: TraceState }
type AgentRFNode = Node<AgentNodeData, 'agent'>

function AgentNode({ data, selected }: NodeProps<AgentRFNode>) {
  const t = useContent()
  const meta = KIND_META[data.kind]
  const Icon = meta.icon
  const isTerminal = data.kind === 'start' || data.kind === 'end'
  const isActive = data.traceState === 'active'
  const isVisited = data.traceState === 'visited'

  if (isTerminal) {
    return (
      <div className={cn(
        'inline-flex items-center gap-1.5 h-8 pl-3 pr-3.5 rounded-full border bg-brand-tint text-brand transition-shadow',
        isActive
          ? 'border-brand shadow-ring-brand'
          : selected ? 'border-brand shadow-ring-brand-sm' : 'border-brand/25',
      )}>
        {data.kind !== 'start' && <Handle type="target" position={Position.Left} className="!bg-neutral-500 !border-0 !w-1.5 !h-1.5" />}
        <Icon size={12} strokeWidth={2} />
        <span className="text-[12px] font-[600] leading-4 whitespace-nowrap">{data.title}</span>
        {data.kind !== 'end' && <Handle type="source" position={Position.Right} className="!bg-neutral-500 !border-0 !w-1.5 !h-1.5" />}
      </div>
    )
  }

  return (
    <div className={cn(
      'w-[230px] rounded-[10px] border px-3.5 py-3 flex flex-col gap-1.5 transition-all',
      'shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06),0px_1px_2px_-1px_rgba(0,0,0,0.05)]',
      isVisited ? 'bg-brand-tint/40' : 'bg-white',
      isActive
        ? 'border-brand shadow-ring-brand'
        : isVisited
          ? 'border-brand/30'
          : selected ? 'border-brand shadow-ring-brand-sm' : 'border-neutral-400',
    )}>
      <Handle type="target" position={Position.Left} className="!bg-neutral-500 !border-0 !w-1.5 !h-1.5" />
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon size={13} strokeWidth={1.7} className="text-neutral-600 shrink-0" />
        <span className="text-[10.5px] font-[500] text-neutral-500 leading-3">{t(meta.labelKey)}</span>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-brand-light shrink-0" style={{ animation: 'speakPulse 1s ease-in-out infinite' }} />
        )}
        <span className="flex-1 min-w-0 text-right font-mono text-[9px] text-neutral-400 leading-3 truncate">
          {data.kind === 'tool' ? (data.tool ?? meta.primitive) : meta.primitive}
        </span>
      </div>
      <p className="text-[12.5px] font-[600] text-neutral-900 leading-[1.35]">{data.title}</p>
      {data.instruction && (
        <p className="text-[11px] text-neutral-600 leading-[1.45] line-clamp-3">{data.instruction}</p>
      )}
      <Handle type="source" position={Position.Right} className="!bg-neutral-500 !border-0 !w-1.5 !h-1.5" />
    </div>
  )
}

/* Edge conditions are the noisiest layer of the diagram. Render them as
   quiet pills hovering just ABOVE the wire (never on it), truncated to one
   breath — hover any pill to read the full condition. */
function ConditionEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data }: EdgeProps) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  const condition = (data as { condition?: string } | undefined)?.condition
  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      {condition && (
        <EdgeLabelRenderer>
          <div
            title={condition}
            className="absolute max-w-[150px] hover:max-w-none truncate px-1.5 py-0.5 rounded-full border border-neutral-300 bg-bg-page/95 text-[9.5px] font-[500] text-neutral-500 leading-3 whitespace-nowrap hover:text-neutral-800 hover:border-neutral-500 hover:z-10 transition-colors pointer-events-auto"
            style={{ transform: `translate(-50%, -130%) translate(${labelX}px, ${labelY}px)` }}
          >
            {condition}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const nodeTypes = { agent: AgentNode }
const edgeTypes = { condition: ConditionEdge }

interface FlowCanvasProps {
  flow: AgentFlow
  /** Node the live preview call is currently on. */
  activeNodeId?: string | null
  /** Nodes the call has already passed through. */
  visitedIds?: string[]
}

export function FlowCanvas({ flow, activeNodeId, visitedIds }: FlowCanvasProps) {
  // Remount the inner canvas only on STRUCTURAL change — trace updates flow
  // through state so the viewport doesn't re-fit mid-call.
  const structKey = useMemo(
    () => `${flow.nodes.map(n => n.id).join('.')}|${flow.edges.length}`,
    [flow],
  )
  return <FlowCanvasInner key={structKey} flow={flow} activeNodeId={activeNodeId} visitedIds={visitedIds} />
}

function FlowCanvasInner({ flow, activeNodeId, visitedIds }: FlowCanvasProps) {
  const { initialNodes, initialEdges } = useMemo(() => {
    const positions = layoutFlow(flow)
    const nodes: AgentRFNode[] = flow.nodes.map(n => ({
      id: n.id,
      type: 'agent',
      position: positions[n.id] ?? { x: 0, y: 0 },
      data: { kind: n.kind, title: n.title, instruction: n.instruction, tool: n.tool },
    }))
    const edges: Edge[] = flow.edges.map((e, i) => ({
      id: `${e.from}→${e.to}-${i}`,
      source: e.from,
      target: e.to,
      type: 'condition',
      data: { condition: e.condition },
      style: { stroke: 'var(--color-neutral-500)', strokeWidth: 1.25 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-neutral-500)', width: 16, height: 16 },
    }))
    return { initialNodes: nodes, initialEdges: edges }
  }, [flow])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  // Paint the live trace onto node data without remounting.
  useEffect(() => {
    setNodes(ns => ns.map(n => {
      const traceState: TraceState = n.id === activeNodeId
        ? 'active'
        : visitedIds?.includes(n.id) ? 'visited' : undefined
      if (n.data.traceState === traceState) return n
      return { ...n, data: { ...n.data, traceState } }
    }))
  }, [activeNodeId, visitedIds, setNodes])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
      minZoom={0.15}
      nodesConnectable={false}
      deleteKeyCode={null}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--color-neutral-400)" />
      <Controls showInteractive={false} position="bottom-right" />
    </ReactFlow>
  )
}
