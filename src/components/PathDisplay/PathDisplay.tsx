import { FC, useEffect, useState } from 'react'
import './PathDisplay.css'
import { CostByNodeId, Node, Path, Vector, getDistance2D, getTravelCostByDestNodeIdMap, sumVectors } from '../../tree'

// TODO: delete unused code

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

async function delayMs(ms: number) {
	return new Promise(resolve => {
		setTimeout(resolve, ms)
	})
}

function calculatePointAtSameAngle(center: Point, p: Point, r: number): Point {
	// Calculate the vector from center to P1
	const vectorCP1: Point = {
		x: p.x - center.x,
		y: p.y - center.y,
	}

	// Calculate the magnitude of the vector CP1
	const magnitudeCP1: number = Math.sqrt(vectorCP1.x * vectorCP1.x + vectorCP1.y * vectorCP1.y)

	// Calculate the unit vector in the direction of CP1
	const unitVectorCP1: Point = {
		x: vectorCP1.x / magnitudeCP1,
		y: vectorCP1.y / magnitudeCP1,
	}

	// Calculate the point P2 at the same angle with a different radius
	const p2: Point = {
		x: center.x + unitVectorCP1.x * r,
		y: center.y + unitVectorCP1.y * r,
	}

	return p2
}

function getCostOfGoingToMostExpensiveDestination(root: Node): number {
	const vistedByNodeId: {
		[id: number]: boolean,
	} = {}

	function getCostOfGoingToMostExpensiveDestinationRecurs(node: Node, pastCost: number = 0): number {
		if (vistedByNodeId[node.id]) return pastCost
		vistedByNodeId[node.id] = true
		
		let maxFutureCost = 0
		for (const edge of node.edges) {
			const otherNode = edge.a.id === node.id ? edge.b : edge.a
			const currentCost = edge.cost

			const futureCost = getCostOfGoingToMostExpensiveDestinationRecurs(otherNode, pastCost + currentCost)
			if (futureCost > maxFutureCost) {
				maxFutureCost = futureCost
			}
		}

		return maxFutureCost
	}

	return getCostOfGoingToMostExpensiveDestinationRecurs(root)
}

type Point = {
	x: number,
	y: number,
}

type PointByNodeId = {
	[id: number]: Point,
}

type RingNumByNodeId = {
	[id: number]: number,
}

interface PathDisplayProps {
	nodes: Node[]
	path: Path
}

interface CostByNodeIdByNodeId {
	[id: number]: CostByNodeId
}

const RADIUS = 275
const PathDisplay: FC<PathDisplayProps> = props => {
	const { nodes, path } = props

	const [pointByNodeId, setPointByNodeId] = useState({} as PointByNodeId)
	const [ringNumByNodeId, setRingNumByNodeId] = useState({} as RingNumByNodeId)
	const [maxTravelCost, setMaxTravelCost] = useState(0)
	const [
		travelCostByDestNodeIdByOriginNodeId,
		setTravelCostByDestNodeIdByOriginNodeId
	] = useState(null as CostByNodeIdByNodeId|null)


	useEffect(() => {
		if (nodes.length === 0) return

		const newTravelCostByDestNodeIdByOriginNodeId: CostByNodeIdByNodeId = {}
		for (const node of nodes) {
			const travelCostByDestNodeId: {
				[id: number]: number,
			} = getTravelCostByDestNodeIdMap(node)
			newTravelCostByDestNodeIdByOriginNodeId[node.id] = travelCostByDestNodeId
		}
		setTravelCostByDestNodeIdByOriginNodeId(newTravelCostByDestNodeIdByOriginNodeId)

		let newMaxTravelCost = 0
		for (const node of nodes) {
			for (const otherNode of nodes) {
				const travelCost = newTravelCostByDestNodeIdByOriginNodeId[node.id][otherNode.id]
				if (travelCost > newMaxTravelCost) {
					newMaxTravelCost = travelCost
				}
			}
		}
		setMaxTravelCost(newMaxTravelCost)

		const maxTravelCostByNodeId: {
			[id: number]: number,
		} = {}
		for (const node of nodes) {
			const maxTravelCost = getCostOfGoingToMostExpensiveDestination(node)
			maxTravelCostByNodeId[node.id] = maxTravelCost
		}
		const minTravelCost = Math.min(...Object.values(maxTravelCostByNodeId))

		const newRingNumByNodeId: RingNumByNodeId = {}
		for (const node of nodes) {
			const ringNum = maxTravelCostByNodeId[node.id] - minTravelCost
			newRingNumByNodeId[node.id] = ringNum
		}
		// const maxRingNum = Math.max(...Object.values(newRingNumByNodeId))
		// for (const node of nodes) {
		// 	const ringNum = newRingNumByNodeId[node.id]
		// 	const reverseRingNum = maxRingNum - ringNum
		// 	newRingNumByNodeId[node.id] = reverseRingNum
		// }

		setRingNumByNodeId(newRingNumByNodeId)
	}, [nodes])

	useEffect(() => {
		if (nodes.length === 0) return

		const canvas = select('#canvas') as HTMLCanvasElement
		const ctx = canvas.getContext("2d") as CanvasRenderingContext2D

		const centerX = canvas.width / 2
		const centerY = canvas.height / 2
		const center = {
			x: centerX,
			y: centerY
		}
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
		// console.log({
		// 	maxPriceByItem,
		// 	minPriceByItem,
		// 	nodeItems: nodes.map(node => Object.keys(node.priceByItem))
		// })

		// calc curPointByNodeId
		const curPointByNodeId: PointByNodeId = {}
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i]

			const r = RADIUS*0.3 + RADIUS*0.7 * (i/nodes.length)
			const angle = i * angleIncrement * 3
			const x = centerX + r * Math.cos(angle)
			const y = centerY + r * Math.sin(angle)
			curPointByNodeId[node.id] = {x, y}
		}

		// rearrange nodes
		(async () => {
			const vectorByNodeId: {
				[nodeId: number]: Vector
			} = {}
			const maxItr = 150
			const speed = 1000/maxItr
			for (let itr = 0; itr < maxItr; itr++) {
				const repellForceFrac = 1
				const ringForceFrac = 0.1 + 1 - (itr/maxItr)
				const pullForceFrac = 0.1 + 1 - Math.abs(Math.cos(Math.PI * (3*itr / maxItr)))
				const pushForceFrac = 0.1 + 1 - pullForceFrac
				let maxDistance = 0

				const edgeDistances = nodes
					.flatMap(node => node.edges)
					.map(edge => {
						const aPoint = curPointByNodeId[edge.a.id]
						const bPoint = curPointByNodeId[edge.b.id]

						const xDist = aPoint.x - bPoint.x
						const yDist = aPoint.y - bPoint.y

						return Math.sqrt(xDist**2 + yDist**2)
					})
				const longestEdge = Math.max(...edgeDistances)

				for (const node of nodes) {
					const nodePoint = curPointByNodeId[node.id]

					const vectors: Vector[] = [
						[0, 0]
					]

					// repell nodes apart relative to travel cost
					for (const otherNode of nodes) {
						if (otherNode.id === node.id) continue
						if (travelCostByDestNodeIdByOriginNodeId === null) continue

						const travelCost = travelCostByDestNodeIdByOriginNodeId[node.id][otherNode.id] || Number.POSITIVE_INFINITY
						const oPoint = curPointByNodeId[otherNode.id]

						const xDist = nodePoint.x - oPoint.x
						const yDist = nodePoint.y - oPoint.y
						const rawVector = [xDist, yDist]
						const frac = 0.3 * (travelCost / maxTravelCost) * repellForceFrac
						const vector = [
							rawVector[0]*frac*speed,
							rawVector[1]*frac*speed
						]

						vectors.push(vector)
					}

					// this node is pulled toward closest point on node's ring
					const ringNum = ringNumByNodeId[node.id] || 0
					const maxRingNum = Math.max(...Object.values(ringNumByNodeId))
					const ringRadius = RADIUS * (ringNum / maxRingNum)
					const ringPoint = calculatePointAtSameAngle(center, nodePoint, ringRadius)
					{
						const aPoint = nodePoint
						const bPoint = ringPoint

						const xDist = aPoint.x - bPoint.x
						const yDist = aPoint.y - bPoint.y

						const rawVector: Vector = [
							-1*xDist,
							-1*yDist
						]
						const dist = getDistance2D(rawVector)
						const frac = (dist**1.5 / longestEdge) * ringForceFrac
						const vector: Vector = [
							rawVector[0]*frac*speed,
							rawVector[1]*frac*speed
						]

						// vectors.push(vector)
					}

					// other nodes push this node away
					for (const otherNode of nodes) {
						if (otherNode.id === node.id) continue

						const oPoint = curPointByNodeId[otherNode.id]

						const xDist = nodePoint.x - oPoint.x
						const yDist = nodePoint.y - oPoint.y
						const rawVector = [xDist, yDist]
						const dist = getDistance2D(rawVector)
						const frac = 0.5 * (longestEdge / dist)**1.2 * pushForceFrac
						const vector = [
							rawVector[0]*frac*speed,
							rawVector[1]*frac*speed
						]

						vectors.push(vector)
					}

					// edges pull this node toward neighbors
					for (const edge of node.edges) {
						const aPoint = curPointByNodeId[edge.a.id]
						const bPoint = curPointByNodeId[edge.b.id]

						const xDist = aPoint.x - bPoint.x
						const yDist = aPoint.y - bPoint.y

						const rawVector = [-1*xDist, -1*yDist]
						const dist = getDistance2D(rawVector)
						const frac = Math.max(0, Math.min(1, (dist**1.2 / longestEdge) * pullForceFrac))
						const vector = [
							rawVector[0]*frac*speed,
							rawVector[1]*frac*speed
						]

						// vectors.push(vector)
					}

					// TODO: delete this paragraph (for efficiency)
					const vectorsHasNaN = vectors.some(v => {
						isNaN(v[0]) || isNaN(v[1])
					})
					if (vectorsHasNaN) {
						throw 'vectorsHasNaN'
					}
					
					const sumVector = sumVectors(vectors)
					const vector = sumVector
						? [
							sumVector[0] / vectors.length,
							sumVector[1] / vectors.length
						]
						: [0, 0]
					vectorByNodeId[node.id] = vector

					const vectorDist = getDistance2D(vector)
					if (vectorDist > maxDistance) {
						maxDistance = vectorDist
					}
				}

				// move nodes
				const movedPointByNodeId: PointByNodeId = {}
				for (const node of nodes) {
					const vector = vectorByNodeId[node.id]
					const curPoint = curPointByNodeId[node.id]
					movedPointByNodeId[node.id] = {
						x: curPoint.x + vector[0],
						y: curPoint.y + vector[1]
					}
				}
				for (const node of nodes) {
					curPointByNodeId[node.id] = movedPointByNodeId[node.id]
				}

				// recenter and rescale nodes
				const curPoints = Object.values(curPointByNodeId)
				const xMinWeb = curPoints
					.map(p => p.x)
					.reduce((acc, cur) => {
						return acc < cur ? acc : cur
					}, Number.MAX_VALUE)
				const yMinWeb = curPoints
					.map(p => p.y)
					.reduce((acc, cur) => {
						return acc < cur ? acc : cur
					}, Number.MAX_VALUE)
				const xMaxWeb = curPoints
					.map(p => p.x)
					.reduce((acc, cur) => {
						return acc > cur ? acc : cur
					}, 0)
				const yMaxWeb = curPoints
					.map(p => p.y)
					.reduce((acc, cur) => {
						return acc > cur ? acc : cur
					}, 0)
				
				const xMinDisplay = centerX - RADIUS
				const yMinDisplay = centerY - RADIUS
				const xMaxDisplay = centerX + RADIUS
				const yMaxDisplay = centerY + RADIUS

				const widthDisplay = xMaxDisplay - xMinDisplay
				const heightDisplay = yMaxDisplay - yMinDisplay

				const widthWeb = xMaxWeb - xMinWeb
				const heightWeb = yMaxWeb - yMinWeb

				const recenteredPointByNodeId: PointByNodeId = {}
				for (const node of nodes) {
					const p = curPointByNodeId[node.id]
					const xFrac = (p.x - xMinWeb) / widthWeb
					const x = xMinDisplay + widthDisplay * xFrac
					const yFrac = (p.y - yMinWeb) / heightWeb
					const y = yMinDisplay + heightDisplay * yFrac
					recenteredPointByNodeId[node.id] = {
						x,
						y
					}
				}
				for (const node of nodes) {
					curPointByNodeId[node.id] = recenteredPointByNodeId[node.id]
				}



				// animate movement (for debugging)
				const animateMovement_debug = true
				if (animateMovement_debug) {
					ctx.clearRect(0, 0, canvas.width, canvas.height)
					draw(curPointByNodeId)
					await delayMs(1)
					console.log('draw frame')
				}



			}

			ctx.clearRect(0, 0, canvas.width, canvas.height)
			draw(curPointByNodeId)
			console.log('drawing done', curPointByNodeId)

			setPointByNodeId(curPointByNodeId)
		})()

		function draw(curPointByNodeId: PointByNodeId) {
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

					const a = curPointByNodeId[edge.a.id]
					const b = curPointByNodeId[edge.b.id]

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
				const {x, y} = curPointByNodeId[node.id]

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
					if (!r && r !== 0) {
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
		}
	}, [travelCostByDestNodeIdByOriginNodeId])

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
						display: 'none'
					}}
				/>
			</header>
		</div>
	)
}

export default PathDisplay
