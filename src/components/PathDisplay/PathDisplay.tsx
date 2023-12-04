import { FC, useEffect, useState } from 'react'
import './PathDisplay.css'
import { Node, Path } from '../../tree'

// utils

const select = document.querySelector.bind(document)

const itemColorOpacity = 0.6
const colorByItem: {
	[item: string]: string
} = {
	copper: `rgba(165, 42, 42, ${itemColorOpacity})`, //brown
	silver: `rgba(192, 192, 192, ${itemColorOpacity})`, //silver
	gold: `rgba(255, 215, 0, ${itemColorOpacity})`, //gold
	diamond: `rgba(0, 128, 128, ${itemColorOpacity})`, //teal
}

// create nodes and edges










type Point = {
	x: number,
	y: number,
}

type PointByNodeId = {
	[id: number]: Point,
}

interface PathDisplayProps {
	nodes: Node[]
	path: Path
}

const RADIUS = 275
const PathDisplay: FC<PathDisplayProps> = props => {
	const { nodes, path } = props

	const [pointByNodeId, setPointByNodeId] = useState({} as PointByNodeId)

	useEffect(() => {
		const canvas = select('#canvas') as HTMLCanvasElement
		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D

		const centerX = canvas.width / 2
		const centerY = canvas.height / 2
		const angleIncrement = (2 * Math.PI) / nodes.length
	
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		// calc min/maxPriceByItem
		const maxPriceByItem: {
			[item: string]: number
		} = {}
		const minPriceByItem: {
			[item: string]: number
		} = {}
		for (let node of nodes) {
			const items = Object.keys(node.priceByItem)
			for (let item of items) {
				const nodePrice = node.priceByItem[item]
				const maxPrice = maxPriceByItem[item] || 0
				const minPrice = minPriceByItem[item] || Number.MAX_VALUE
				if (nodePrice <= minPrice) {
					minPriceByItem[item] = nodePrice
				}
				if (nodePrice >= maxPrice) {
					maxPriceByItem[item] = nodePrice
				}
			}
		}
		console.log({
			maxPriceByItem,
			minPriceByItem,
			nodeItems: nodes.map(node => Object.keys(node.priceByItem))
		})

		// calc newPointByNodeId
		const newPointByNodeId: PointByNodeId = {}
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i]

			const r = RADIUS*0.3 + RADIUS*0.7 * (i/nodes.length)
			const angle = i * angleIncrement * 3
			const x = centerX + r * Math.cos(angle)
			const y = centerY + r * Math.sin(angle)
			newPointByNodeId[node.id] = {x, y}
		}

		// draw edges
		ctx.beginPath()
		ctx.strokeStyle = 'orange'
		const seenByEdgeId: {
			[id: number]: boolean
		} = {}
		for (let node of nodes) {
			for (let edge of node.edges) {
				if (seenByEdgeId[edge.id]) continue
				seenByEdgeId[edge.id] = true

				const a = newPointByNodeId[edge.a.id]
				const b = newPointByNodeId[edge.b.id]

				// draw
				ctx.moveTo(a.x, a.y)
				ctx.lineTo(b.x, b.y)
			}
		}
		ctx.stroke()
		ctx.closePath()

		// draw nodes
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i]
			const {x, y} = newPointByNodeId[node.id]

			// draw
			const items = Object.keys(colorByItem)
			const radsPerItem = 2 * Math.PI / items.length
			for (let i = 0; i < items.length; i++) {
				const item = items[i]
				const price = node.priceByItem[item]
				const savings = maxPriceByItem[item] - price
				const r = price
					? 3 + 3 * Math.sqrt(0 + (savings * items.length) / Math.PI)
					: 0
				if (!r) {
					console.log({
						r,
						price,
						'maxPriceByItem[item]': maxPriceByItem[item]
					})
				}

				const padding = 1
				const beginAngle = i * radsPerItem
				const endAngle = (i+1) * radsPerItem
				const medianAngle = (endAngle + beginAngle) / 2
				const xOffset = Math.cos(medianAngle) * padding
				const yOffset = Math.sin(medianAngle) * padding
				ctx.beginPath()
				ctx.fillStyle = colorByItem[item]
				ctx.moveTo(x + xOffset, y + yOffset)
				ctx.arc(x + xOffset, y + yOffset, r, beginAngle, endAngle)
				ctx.lineTo(x + xOffset, y + yOffset)
				ctx.stroke()
				ctx.fill()
				ctx.closePath()
			}
		}

		setPointByNodeId(newPointByNodeId)
	}, [nodes.length])

	useEffect(() => {
		if (!Object.keys(pointByNodeId).length) return

		const canvas = select('#pathCanvas') as HTMLCanvasElement
		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D

		ctx.clearRect(0, 0, canvas.width, canvas.height)
		
		// draw steps
		ctx.beginPath()
		ctx.lineWidth = 3
		ctx.strokeStyle = 'blue'
		let pPrev: Point|null = null
		for (let step of path.steps) {
			const p = pointByNodeId[step.nodeId]

			// draw
			ctx.moveTo(pPrev?.x || p.x, pPrev?.y || p.y)
			ctx.lineTo(p.x, p.y)

			pPrev = p
		}
		ctx.stroke()
		ctx.closePath()

	}, [pointByNodeId, path])

	const canvasStyle = {
		border: "1px solid #d3d3d3"
	}
	return (
		<div className="PathDisplay">
			<header className="Display-header">
				<canvas
					id="canvas"
					width="800"
					height="600"
					style={canvasStyle}
				/>
				<canvas
					id="pathCanvas"
					width="800"
					height="600"
					style={{
						...canvasStyle,
						position: 'absolute',
					}}
				/>
			</header>
		</div>
	)
}

export default PathDisplay
